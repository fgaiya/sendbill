import { useState, useEffect, useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Client } from '@/lib/shared/types';

import { clientSchemas } from './schemas';
import {
  ClientFormData,
  UseClientFormReturn,
  UseClientFormOptions,
  ClientListParams,
  ClientListResponse,
  UseClientListReturn,
} from './types';

import type { UseFormReturn } from 'react-hook-form';

/**
 * 取引先フォーム管理フック（新規登録・編集両対応）
 */
export function useClientForm(
  options: UseClientFormOptions = {}
): UseClientFormReturn {
  const { clientId } = options;
  const router = useRouter();

  // 基本状態
  const [submitError, setSubmitError] = useState<string>();
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // 編集モード用の追加状態
  const [isLoading, setIsLoading] = useState(!!clientId);
  const [fetchError, setFetchError] = useState<string>();
  const [client, setClient] = useState<Client>();

  // モード判定
  const isEditMode = !!clientId;

  // 動的スキーマ選択
  const schema = isEditMode ? clientSchemas.update : clientSchemas.create;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      contactName: '',
      contactEmail: '',
      address: '',
      phone: '',
    },
    mode: 'onBlur',
  }) as UseFormReturn<ClientFormData>;

  // 編集モード時の初期データ取得
  useEffect(() => {
    if (!clientId) return;

    const fetchClient = async () => {
      try {
        setIsLoading(true);
        setFetchError(undefined);

        const response = await fetch(`/api/clients/${clientId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('取引先が見つかりません');
          }
          let errorMessage = '取引先の取得に失敗しました';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // JSON以外のレスポンスの場合はデフォルトメッセージを使用
          }
          throw new Error(errorMessage);
        }

        const clientData: Client = await response.json();
        setClient(clientData);

        // フォームの初期値を設定
        form.reset({
          name: clientData.name,
          contactName: clientData.contactName || '',
          contactEmail: clientData.contactEmail || '',
          address: clientData.address || '',
          phone: clientData.phone || '',
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '取引先の取得に失敗しました';
        setFetchError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchClient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const onSubmit = async (data: ClientFormData) => {
    try {
      setSubmitError(undefined);
      setSubmitSuccess(false);

      // モードに応じてAPIエンドポイントとメソッドを切り替え
      const url = isEditMode ? `/api/clients/${clientId}` : '/api/clients';
      const method = isEditMode ? 'PUT' : 'POST';
      const successMessage = isEditMode
        ? '取引先が正常に更新されました！'
        : '取引先が正常に登録されました！';
      const errorMessage = isEditMode
        ? '取引先の更新に失敗しました'
        : '取引先の登録に失敗しました';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let apiErrorMessage = errorMessage;
        try {
          const errorData = await response.json();
          apiErrorMessage = errorData.error || apiErrorMessage;
        } catch {
          // JSON以外のレスポンスの場合はデフォルトメッセージを使用
        }
        throw new Error(apiErrorMessage);
      }

      setSubmitSuccess(true);

      // 成功トーストを表示
      toast.success(successMessage);

      // モードに応じてリダイレクト先を切り替え
      if (isEditMode) {
        router.push(`/dashboard/clients/${clientId}`);
      } else {
        router.push('/dashboard/clients');
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isEditMode
            ? '取引先の更新に失敗しました'
            : '取引先の登録に失敗しました';
      setSubmitError(message);
      toast.error(message);
    }
  };

  const onReset = () => {
    if (isEditMode && client) {
      // 編集モード: 元のデータに戻す
      form.reset({
        name: client.name,
        contactName: client.contactName || '',
        contactEmail: client.contactEmail || '',
        address: client.address || '',
        phone: client.phone || '',
      });
    } else {
      // 新規登録モード: 空の状態に戻す
      form.reset({
        name: '',
        contactName: '',
        contactEmail: '',
        address: '',
        phone: '',
      });
    }
    setSubmitError(undefined);
    setSubmitSuccess(false);
  };

  const clearMessages = () => {
    setSubmitError(undefined);
    setSubmitSuccess(false);
    setFetchError(undefined);
  };

  return {
    form,
    state: {
      isSubmitting: form.formState.isSubmitting,
      submitError,
      submitSuccess,
      isLoading,
      fetchError,
      client,
    },
    actions: {
      onSubmit: form.handleSubmit(onSubmit),
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
    sort: 'createdAt_desc',
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
        // エラー時は既存のクライアントデータとページネーション状態を保持
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
    void fetchClients();
  }, [fetchClients]);

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

/**
 * 取引先削除管理フック
 */
export function useClientDelete() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();

  const deleteClient = useCallback(async (client: Client): Promise<boolean> => {
    try {
      setIsDeleting(true);
      setDeleteError(undefined);

      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        let errorMessage = '取引先の削除に失敗しました';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON以外のレスポンスの場合はデフォルトメッセージを使用
        }
        throw new Error(errorMessage);
      }

      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '取引先の削除に失敗しました';
      setDeleteError(message);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setDeleteError(undefined);
  }, []);

  return {
    deleteClient,
    isDeleting,
    deleteError,
    clearError,
  };
}
