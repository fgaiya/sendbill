import { useState, useEffect, useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { clientSchemas } from './schemas';
import {
  ClientFormData,
  UseClientFormReturn,
  ClientListParams,
  ClientListResponse,
  UseClientListReturn,
} from './types';

/**
 * 取引先フォーム管理フック
 */
export function useClientForm(): UseClientFormReturn {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string>();
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchemas.create),
    defaultValues: {
      name: '',
      contactName: '',
      contactEmail: '',
      address: '',
      phone: '',
    },
    mode: 'onBlur',
  });

  const onSubmit = async (data: ClientFormData) => {
    try {
      setSubmitError(undefined);
      setSubmitSuccess(false);

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = '取引先の登録に失敗しました';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON以外のレスポンスの場合はデフォルトメッセージを使用
        }
        throw new Error(errorMessage);
      }

      setSubmitSuccess(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '取引先の登録に失敗しました';
      setSubmitError(message);
    }
  };

  const onReset = () => {
    form.reset({
      name: '',
      contactName: '',
      contactEmail: '',
      address: '',
      phone: '',
    });
    setSubmitError(undefined);
    setSubmitSuccess(false);
  };

  const clearMessages = () => {
    setSubmitError(undefined);
    setSubmitSuccess(false);
  };

  // 成功時の自動リダイレクト（useEffectで自動クリーンアップ）
  useEffect(() => {
    if (submitSuccess) {
      const timeoutId = setTimeout(() => {
        router.push('/dashboard');
      }, 3000);

      return () => clearTimeout(timeoutId); // 自動クリーンアップ
    }
  }, [submitSuccess, router]);

  return {
    form,
    state: {
      isSubmitting: form.formState.isSubmitting, // react-hook-formの状態を使用
      submitError,
      submitSuccess,
    },
    actions: {
      onSubmit: form.handleSubmit(onSubmit), // react-hook-formのhandleSubmitでラップ
      onReset,
      clearMessages,
    },
  };
}

/**
 * 取引先一覧管理フック
 */
export function useClientList(
  initialParams: ClientListParams = {}
): UseClientListReturn {
  const [clients, setClients] = useState<ClientListResponse['data']>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const [params, setParams] = useState<ClientListParams>({
    page: 1,
    limit: 20,
    sort: 'created_desc',
    ...initialParams,
  });

  const fetchClients = useCallback(
    async (newParams?: ClientListParams) => {
      setIsLoading(true);
      setError(undefined);

      try {
        const finalParams = { ...params, ...newParams };
        const searchParams = new URLSearchParams();

        // パラメータをURLSearchParamsに変換
        if (finalParams.page)
          searchParams.set('page', finalParams.page.toString());
        if (finalParams.limit)
          searchParams.set('limit', finalParams.limit.toString());
        if (finalParams.q) searchParams.set('q', finalParams.q);
        if (finalParams.sort) searchParams.set('sort', finalParams.sort);

        const response = await fetch(`/api/clients?${searchParams.toString()}`);

        if (!response.ok) {
          let errorMessage = '取引先の取得に失敗しました';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // JSON以外のレスポンスの場合はデフォルトメッセージを使用
          }
          throw new Error(errorMessage);
        }

        const data: ClientListResponse = await response.json();
        setClients(data.data);
        setPagination(data.pagination);

        // パラメータを更新
        if (newParams) {
          setParams(finalParams);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '取引先の取得に失敗しました';
        setError(message);
        setClients([]);
        setPagination({
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [params]
  );

  const setPage = useCallback(
    (page: number) => {
      fetchClients({ page });
    },
    [fetchClients]
  );

  const setSort = useCallback(
    (sort: ClientListParams['sort']) => {
      fetchClients({ sort, page: 1 }); // ソート変更時はページをリセット
    },
    [fetchClients]
  );

  const setSearch = useCallback(
    (q: string) => {
      fetchClients({ q, page: 1 }); // 検索時はページをリセット
    },
    [fetchClients]
  );

  const refresh = useCallback(() => {
    return fetchClients();
  }, [fetchClients]);

  // 初回読み込み
  useEffect(() => {
    fetchClients();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    state: {
      clients,
      isLoading,
      error,
      pagination,
    },
    actions: {
      fetchClients,
      setPage,
      setSort,
      setSearch,
      refresh,
    },
    params,
  };
}
