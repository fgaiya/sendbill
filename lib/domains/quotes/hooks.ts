'use client';

import React, { useState, useEffect, useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormReturn, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';

import { toApiDateString } from '@/lib/shared/utils/date';
import { omitUndefined } from '@/lib/shared/utils/objects';

import { quoteFormWithItemsSchema } from './form-schemas';
import { type QuoteFormWithItemsData } from './form-schemas';

import type {
  Quote,
  QuotesListResponse,
  QuoteSortOption,
  QuoteStatus,
} from './types';

export interface UseQuoteFormOptions {
  quoteId?: string;
}

export interface UseQuoteFormState {
  isSubmitting: boolean;
  submitError?: string;
  isLoading: boolean;
  fetchError?: string;
  quote?: Quote;
}

export interface UseQuoteFormActions {
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onReset: () => void;
  clearMessages: () => void;
}

export interface UseQuoteFormReturn {
  form: UseFormReturn<QuoteFormWithItemsData>;
  state: UseQuoteFormState;
  actions: UseQuoteFormActions;
}

export function useQuoteForm(
  options: UseQuoteFormOptions = {}
): UseQuoteFormReturn {
  const { quoteId } = options;
  const router = useRouter();

  // 基本状態
  const [submitError, setSubmitError] = useState<string>();

  // 編集モード用の追加状態
  const [isLoading, setIsLoading] = useState(!!quoteId);
  const [fetchError, setFetchError] = useState<string>();
  const [quote, setQuote] = useState<Quote>();

  // モード判定
  const isEditMode = !!quoteId;

  // フォームはUI専用スキーマで検証（Dateを要求）
  const formSchema = quoteFormWithItemsSchema;

  const defaultCreateValues: QuoteFormWithItemsData = {
    clientId: '',
    issueDate: new Date(),
    expiryDate: undefined,
    notes: '',
    items: [], // 空の品目配列で開始
  };

  const form = useForm<QuoteFormWithItemsData>({
    resolver: zodResolver(formSchema) as Resolver<
      QuoteFormWithItemsData,
      unknown
    >,
    defaultValues: defaultCreateValues,
    mode: 'onChange',
  });

  const toFormValuesFromQuote = (q: Quote): QuoteFormWithItemsData => ({
    clientId: q.clientId,
    issueDate: new Date(q.issueDate),
    expiryDate: q.expiryDate ? new Date(q.expiryDate) : undefined,
    notes: q.notes || '',
    items:
      q.items?.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxCategory: item.taxCategory,
        taxRate: item.taxRate ?? undefined,
        discountAmount: item.discountAmount,
        unit: item.unit || '',
        sku: item.sku || '',
        sortOrder: item.sortOrder,
        subtotal: item.unitPrice * item.quantity - item.discountAmount, // 小計計算
      })) || [],
  });

  // 編集モード時の初期データ取得
  useEffect(() => {
    if (!quoteId) return;

    let isMounted = true;
    const { reset } = form;

    const fetchQuote = async () => {
      try {
        if (isMounted) {
          setIsLoading(true);
          setFetchError(undefined);
        }

        const response = await fetch(`/api/quotes/${quoteId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('見積書が見つかりません');
          }
          let errorMessage = '見積書の取得に失敗しました';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // JSON以外のレスポンスの場合はデフォルトメッセージを使用
          }
          throw new Error(errorMessage);
        }

        const { data: quote } = await response.json();
        if (isMounted) {
          setQuote(quote);

          // フォームの初期値を設定
          reset(toFormValuesFromQuote(quote));
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '見積書の取得に失敗しました';
        if (isMounted) {
          setFetchError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchQuote();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteId, form.reset]);

  const onSubmit = async (data: QuoteFormWithItemsData) => {
    try {
      setSubmitError(undefined);

      // モードに応じてAPIエンドポイントとメソッドを切り替え
      const url = isEditMode ? `/api/quotes/${quoteId}` : '/api/quotes';
      const method = isEditMode ? 'PUT' : 'POST';
      const successMessage = isEditMode
        ? '見積書が正常に更新されました！'
        : '見積書が正常に作成されました！';
      const errorMessage = isEditMode
        ? '見積書の更新に失敗しました'
        : '見積書の作成に失敗しました';

      // 基本見積書データ（品目を除く）を準備
      const { items, ...basicQuoteData } = data;

      // API送信用のデータを正規化（日付のタイムゾーン対応、空文字列のundefined化）
      const payload = {
        ...basicQuoteData,
        issueDate: toApiDateString(basicQuoteData.issueDate)!,
        expiryDate: toApiDateString(basicQuoteData.expiryDate),
        notes: basicQuoteData.notes?.trim() || undefined,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(omitUndefined(payload)),
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

      const responseData = await response.json();
      const savedQuoteId = isEditMode ? quoteId : responseData.data?.id;
      if (!savedQuoteId) {
        throw new Error('見積書IDの取得に失敗しました');
      }

      // 品目データがある場合は品目APIで処理
      if (items && items.length > 0) {
        try {
          // 品目の一括更新（既存品目は削除して新規作成）
          const itemsPayload = items
            .filter((item) => item.description.trim()) // 空の品目を除外
            .map((item) => ({
              action: 'create' as const,
              data: {
                description: item.description.trim(),
                quantity: Number(item.quantity) || 0,
                unitPrice: Number(item.unitPrice) || 0,
                taxCategory: item.taxCategory,
                taxRate:
                  item.taxRate !== undefined ? Number(item.taxRate) : undefined,
                discountAmount: Number(item.discountAmount) || 0,
                unit: item.unit?.trim() || undefined,
                sku: item.sku?.trim() || undefined,
                sortOrder: item.sortOrder,
              },
            }));

          if (itemsPayload.length > 0) {
            const itemsResponse = await fetch(
              `/api/quotes/${savedQuoteId}/items`,
              {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  items: itemsPayload,
                }),
              }
            );

            if (!itemsResponse.ok) {
              let errorMessage = '品目の保存に失敗しました';
              try {
                const itemsError = await itemsResponse.json();
                errorMessage = itemsError.error || errorMessage;
              } catch {}
              throw new Error(errorMessage);
            }
          }
        } catch (itemsError) {
          // 品目保存エラーはワーニングとして表示（見積書自体は保存済み）
          const itemsMessage =
            itemsError instanceof Error
              ? itemsError.message
              : '品目の保存に失敗しました';
          toast.error(`見積書は保存されましたが、${itemsMessage}`);
        }
      }

      toast.success(successMessage);

      // 即座にリダイレクト（toastは遷移先でも継続表示される）
      router.push('/dashboard/quotes');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isEditMode
            ? '見積書の更新に失敗しました'
            : '見積書の作成に失敗しました';
      setSubmitError(message);
      toast.error(message);
    }
  };

  const onReset = () => {
    if (isEditMode && quote) {
      // 編集モード: 元のデータに戻す
      form.reset(toFormValuesFromQuote(quote));
    } else {
      // 新規作成モード: 既定値に戻す
      form.reset(defaultCreateValues);
    }
    setSubmitError(undefined);
  };

  const clearMessages = () => {
    setSubmitError(undefined);
    setFetchError(undefined);
  };

  return {
    form,
    state: {
      isSubmitting: form.formState.isSubmitting,
      submitError,
      isLoading,
      fetchError,
      quote,
    },
    actions: {
      onSubmit: form.handleSubmit(onSubmit),
      onReset,
      clearMessages,
    },
  };
}

// Quote List Hook Types
export interface QuoteListParams {
  page?: number;
  limit?: number;
  q?: string;
  sort?: QuoteSortOption;
  status?: QuoteStatus;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface UseQuoteListState {
  quotes: Quote[];
  isLoading: boolean;
  error?: string;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UseQuoteListActions {
  fetchQuotes: (newParams?: QuoteListParams) => Promise<void>;
  setPage: (page: number) => void;
  setSort: (sort: QuoteSortOption) => void;
  setSearch: (q: string) => void;
  setStatusFilter: (status: QuoteStatus | undefined) => void;
  setClientFilter: (clientId: string | undefined) => void;
  setDateFilter: (dateFrom?: string, dateTo?: string) => void;
  refresh: () => Promise<void>;
  updateQuoteStatus: (quoteId: string, newStatus: QuoteStatus) => Promise<void>;
}

export interface UseQuoteListReturn {
  state: UseQuoteListState;
  actions: UseQuoteListActions;
  params: QuoteListParams;
}

export function useQuoteList(
  initialParams: QuoteListParams = {}
): UseQuoteListReturn {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const [params, setParams] = useState<QuoteListParams>({
    page: 1,
    limit: 20,
    sort: 'createdAt_desc',
    ...initialParams,
  });

  const fetchQuotes = useCallback(
    async (newParams?: QuoteListParams) => {
      setIsLoading(true);
      setError(undefined);

      try {
        const finalParams = { ...params, ...newParams };
        const searchParams = new URLSearchParams();

        // パラメータをURLSearchParamsに変換（値が存在する場合のみ）
        if (finalParams.page)
          searchParams.set('page', finalParams.page.toString());
        if (finalParams.limit)
          searchParams.set('limit', finalParams.limit.toString());
        if (finalParams.q?.trim()) searchParams.set('q', finalParams.q.trim());
        if (finalParams.sort) searchParams.set('sort', finalParams.sort);
        if (finalParams.status) searchParams.set('status', finalParams.status);
        if (finalParams.clientId?.trim())
          searchParams.set('clientId', finalParams.clientId.trim());
        if (finalParams.dateFrom?.trim())
          searchParams.set('dateFrom', finalParams.dateFrom.trim());
        if (finalParams.dateTo?.trim())
          searchParams.set('dateTo', finalParams.dateTo.trim());

        // 一覧表示では常にclient情報とitems情報を含める（金額計算に必要）
        searchParams.set('include', 'client,items');

        const response = await fetch(`/api/quotes?${searchParams.toString()}`);

        if (!response.ok) {
          let errorMessage = '見積書の取得に失敗しました';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // JSON以外のレスポンスの場合はデフォルトメッセージを使用
          }
          throw new Error(errorMessage);
        }

        const data: QuotesListResponse = await response.json();
        setQuotes(data.data);
        setPagination(data.pagination);

        // パラメータを更新
        if (newParams) {
          setParams(finalParams);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '見積書の取得に失敗しました';
        setError(message);
        // エラー時は既存の見積書データとページネーション状態を保持
      } finally {
        setIsLoading(false);
      }
    },
    [params]
  );

  const setPage = useCallback(
    (page: number) => {
      fetchQuotes({ page });
    },
    [fetchQuotes]
  );

  const setSort = useCallback(
    (sort: QuoteSortOption) => {
      fetchQuotes({ sort, page: 1 }); // ソート変更時はページをリセット
    },
    [fetchQuotes]
  );

  const setSearch = useCallback(
    (q: string) => {
      fetchQuotes({ q, page: 1 }); // 検索時はページをリセット
    },
    [fetchQuotes]
  );

  const setStatusFilter = useCallback(
    (status: QuoteStatus | undefined) => {
      fetchQuotes({ status, page: 1 }); // フィルタ変更時はページをリセット
    },
    [fetchQuotes]
  );

  const setClientFilter = useCallback(
    (clientId: string | undefined) => {
      fetchQuotes({ clientId, page: 1 });
    },
    [fetchQuotes]
  );

  const setDateFilter = useCallback(
    (dateFrom?: string, dateTo?: string) => {
      fetchQuotes({ dateFrom, dateTo, page: 1 });
    },
    [fetchQuotes]
  );

  const refresh = useCallback(() => {
    return fetchQuotes();
  }, [fetchQuotes]);

  const updateQuoteStatus = useCallback(
    async (quoteId: string, newStatus: QuoteStatus) => {
      // ローカル状態を楽観的に更新
      setQuotes((currentQuotes) =>
        currentQuotes.map((quote) =>
          quote.id === quoteId ? { ...quote, status: newStatus } : quote
        )
      );

      try {
        const response = await fetch(`/api/quotes/${quoteId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          // エラー時は元に戻す
          await refresh();

          let errorMessage = 'ステータスの変更に失敗しました';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // JSON以外のレスポンスの場合はデフォルトメッセージを使用
          }
          throw new Error(errorMessage);
        } else {
          // サーバー結果でローカルを正規化（番号採番なども反映）
          const { data: updated } = await response.json();
          setQuotes((currentQuotes) =>
            currentQuotes.map((q) => (q.id === updated.id ? updated : q))
          );
        }
      } catch (err) {
        // エラー時はリフレッシュしてサーバー状態と同期
        await refresh();
        throw err;
      }
    },
    [refresh]
  );

  // 初回読み込み
  useEffect(() => {
    void fetchQuotes();
  }, [fetchQuotes]);

  return {
    state: {
      quotes,
      isLoading,
      error,
      pagination,
    },
    actions: {
      fetchQuotes,
      setPage,
      setSort,
      setSearch,
      setStatusFilter,
      setClientFilter,
      setDateFilter,
      refresh,
      updateQuoteStatus,
    },
    params,
  };
}

// Quote Delete Hook Types
export interface UseQuoteDeleteState {
  isDeleting: boolean;
  deleteError?: string;
}

export interface UseQuoteDeleteActions {
  deleteQuote: (quote: Quote) => Promise<boolean>;
  clearError: () => void;
}

export interface UseQuoteDeleteReturn
  extends UseQuoteDeleteState,
    UseQuoteDeleteActions {}

export function useQuoteDelete(): UseQuoteDeleteReturn {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();

  const deleteQuote = useCallback(async (quote: Quote): Promise<boolean> => {
    setIsDeleting(true);
    setDeleteError(undefined);

    try {
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        let errorMessage = '見積書の削除に失敗しました';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON以外のレスポンスの場合はデフォルトメッセージを使用
        }
        throw new Error(errorMessage);
      }

      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '見積書の削除に失敗しました';
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
    isDeleting,
    deleteError,
    deleteQuote,
    clearError,
  };
}

// Quote Status Change Hook
export function useQuoteStatusChange() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string>();

  const changeStatus = useCallback(
    async (quoteId: string, newStatus: QuoteStatus): Promise<void> => {
      setIsUpdating(true);
      setStatusError(undefined);

      try {
        const response = await fetch(`/api/quotes/${quoteId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          let errorMessage = 'ステータスの変更に失敗しました';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // JSON以外のレスポンスの場合はデフォルトメッセージを使用
          }
          throw new Error(errorMessage);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'ステータスの変更に失敗しました';
        setStatusError(message);
        throw err; // 上位で処理できるよう再スロー
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  const clearStatusError = useCallback(() => {
    setStatusError(undefined);
  }, []);

  return {
    changeStatus,
    isUpdating,
    statusError,
    clearStatusError,
  };
}
