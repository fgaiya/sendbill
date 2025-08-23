'use client';

import React, { useState, useEffect, useCallback } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormReturn, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';

import { toApiDateString } from '@/lib/shared/utils/date';
import { omitUndefined } from '@/lib/shared/utils/objects';

import { invoiceFormWithPaymentSchema } from './form-schemas';
import { type InvoiceFormWithPaymentData } from './form-schemas';
import { calculateDueDate } from './utils';

import type {
  Invoice,
  InvoicesListResponse,
  InvoiceSortOption,
  InvoiceStatus,
} from './types';

export interface UseInvoiceFormOptions {
  invoiceId?: string;
  defaultPaymentTermDays?: number;
  enabled?: boolean;
}

export interface UseInvoiceFormState {
  isSubmitting: boolean;
  submitError?: string;
  isLoading: boolean;
  fetchError?: string;
  invoice?: Invoice;
}

export interface UseInvoiceFormActions {
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  submitAndGet: () => Promise<Invoice | undefined>;
  onReset: () => void;
  clearMessages: () => void;
  setDueDateFromIssueDate: (issueDate: Date, paymentTermDays?: number) => void;
}

export interface UseInvoiceFormReturn {
  form: UseFormReturn<InvoiceFormWithPaymentData>;
  state: UseInvoiceFormState;
  actions: UseInvoiceFormActions;
}

export function useInvoiceForm(
  options: UseInvoiceFormOptions = {}
): UseInvoiceFormReturn {
  const { invoiceId, defaultPaymentTermDays = 30, enabled = true } = options;

  // 基本状態
  const [submitError, setSubmitError] = useState<string>();

  // 編集モード用の追加状態
  const [isLoading, setIsLoading] = useState(Boolean(invoiceId && enabled));
  const [fetchError, setFetchError] = useState<string>();
  const [invoice, setInvoice] = useState<Invoice>();

  // モード判定
  const isEditMode = !!invoiceId;

  // フォームはUI専用スキーマで検証（Dateを要求）
  const formSchema = invoiceFormWithPaymentSchema;

  const defaultCreateValues: InvoiceFormWithPaymentData = {
    clientId: '',
    issueDate: new Date(),
    dueDate: undefined,
    notes: '',
    quoteId: undefined,
    paymentMethod: 'BANK_TRANSFER',
    paymentTerms: undefined,
    items: [], // 空の品目配列で開始
  };

  const form = useForm<InvoiceFormWithPaymentData>({
    resolver: zodResolver(formSchema) as Resolver<
      InvoiceFormWithPaymentData,
      unknown
    >,
    defaultValues: defaultCreateValues,
    mode: 'onChange',
  });

  const toFormValuesFromInvoice = (
    inv: Invoice
  ): InvoiceFormWithPaymentData => ({
    clientId: inv.clientId,
    issueDate: new Date(inv.issueDate),
    dueDate: inv.dueDate ? new Date(inv.dueDate) : undefined,
    notes: inv.notes || '',
    quoteId: inv.quoteId || undefined,
    paymentMethod:
      (
        inv as Invoice & {
          paymentMethod?: 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CASH' | 'CHECK';
        }
      ).paymentMethod || 'BANK_TRANSFER',
    paymentTerms:
      (inv as Invoice & { paymentTerms?: string }).paymentTerms || undefined,
    items:
      inv.items?.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxCategory: item.taxCategory,
        taxRate: item.taxRate ?? undefined,
        discountAmount: item.discountAmount,
        unit: item.unit || '',
        sku: item.sku || '',
        sortOrder: item.sortOrder,
        subtotal: item.unitPrice * item.quantity - (item.discountAmount ?? 0), // 小計計算（未定義は0）
      })) || [],
  });

  // 発行日から支払期限を自動計算する機能
  const setDueDateFromIssueDate = useCallback(
    (issueDate: Date, paymentTermDays = defaultPaymentTermDays) => {
      const calculatedDueDate = calculateDueDate(issueDate, paymentTermDays);
      form.setValue('dueDate', calculatedDueDate, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form, defaultPaymentTermDays]
  );

  // 編集モード時の初期データ取得
  useEffect(() => {
    if (!invoiceId || !enabled) return;

    let isMounted = true;
    const { reset } = form;
    const controller = new AbortController();

    const fetchInvoice = async () => {
      try {
        if (isMounted) {
          setIsLoading(true);
          setFetchError(undefined);
        }

        const response = await fetch(
          `/api/invoices/${invoiceId}?include=items,client,quote`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('請求書が見つかりません');
          }
          let errorMessage = '請求書の取得に失敗しました';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // JSON以外のレスポンスの場合はデフォルトメッセージを使用
          }
          throw new Error(errorMessage);
        }

        const { data: invoice } = await response.json();
        if (isMounted) {
          setInvoice(invoice);

          // フォームの初期値を設定
          reset(toFormValuesFromInvoice(invoice));
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '請求書の取得に失敗しました';
        if (isMounted) {
          setFetchError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchInvoice();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [invoiceId, enabled, form.reset]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: InvoiceFormWithPaymentData) => {
    try {
      setSubmitError(undefined);

      // モードに応じてAPIエンドポイントとメソッドを切り替え
      const url = isEditMode ? `/api/invoices/${invoiceId}` : '/api/invoices';
      const method = isEditMode ? 'PUT' : 'POST';
      const successMessage = isEditMode
        ? '請求書が正常に更新されました！'
        : '請求書が正常に作成されました！';
      const errorMessage = isEditMode
        ? '請求書の更新に失敗しました'
        : '請求書の作成に失敗しました';

      // 基本請求書データ（品目を除く）を準備
      const { items, ...basicInvoiceData } = data;

      // API送信用のデータを正規化（日付のタイムゾーン対応、空文字列のundefined化）
      const payload = {
        ...basicInvoiceData,
        issueDate: toApiDateString(basicInvoiceData.issueDate)!,
        dueDate: toApiDateString(basicInvoiceData.dueDate),
        notes: basicInvoiceData.notes?.trim() || undefined,
        quoteId: basicInvoiceData.quoteId?.trim() || undefined,
        paymentMethod: basicInvoiceData.paymentMethod || 'BANK_TRANSFER',
        paymentTerms: basicInvoiceData.paymentTerms?.trim() || undefined,
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
      const savedInvoiceId = isEditMode ? invoiceId : responseData.data?.id;
      if (!savedInvoiceId) {
        throw new Error('請求書IDの取得に失敗しました');
      }

      // 品目データ（空配列含む）がある場合は品目APIで処理
      if (items) {
        try {
          // 品目の一括更新（完全置換: 既存品目は削除して新規作成）
          const itemsPayload = items
            .filter((item) => (item.description ?? '').trim().length > 0)
            .map((item) => ({
              description: (item.description ?? '').trim(),
              quantity: Number(item.quantity) || 0,
              unitPrice: Number(item.unitPrice) || 0,
              taxCategory: item.taxCategory,
              taxRate:
                item.taxRate !== undefined ? Number(item.taxRate) : undefined,
              discountAmount: Number(item.discountAmount) || 0,
              unit: item.unit?.trim() || undefined,
              sku: item.sku?.trim() || undefined,
              sortOrder: item.sortOrder,
            }));

          const itemsResponse = await fetch(
            `/api/invoices/${savedInvoiceId}/items`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                items: itemsPayload, // 空配列でも送る（完全置換）
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
        } catch (itemsError) {
          // 品目保存エラーはワーニングとして表示（請求書自体は保存済み）
          const itemsMessage =
            itemsError instanceof Error
              ? itemsError.message
              : '品目の保存に失敗しました';
          toast.error(`請求書は保存されましたが、${itemsMessage}`);
        }
      }

      toast.success(successMessage);

      // 更新されたデータを返す（リダイレクトは呼び出し元で処理）
      return responseData.data as Invoice;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isEditMode
            ? '請求書の更新に失敗しました'
            : '請求書の作成に失敗しました';
      setSubmitError(message);
      toast.error(message);
    }
  };

  const onReset = () => {
    if (isEditMode && invoice) {
      // 編集モード: 元のデータに戻す
      form.reset(toFormValuesFromInvoice(invoice));
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
      invoice,
    },
    actions: {
      onSubmit: form.handleSubmit(onSubmit),
      submitAndGet: async () => {
        let result: Invoice | undefined;
        await form.handleSubmit(async (values) => {
          result = (await onSubmit(values)) ?? undefined;
        })();
        return result;
      },
      onReset,
      clearMessages,
      setDueDateFromIssueDate,
    },
  };
}

// Invoice List Hook Types
export interface InvoiceListParams {
  page?: number;
  limit?: number;
  q?: string;
  sort?: InvoiceSortOption;
  status?: InvoiceStatus;
  clientId?: string;
  quoteId?: string;
  dateFrom?: string;
  dateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface UseInvoiceListState {
  invoices: Invoice[];
  isLoading: boolean;
  error?: string;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UseInvoiceListActions {
  fetchInvoices: (newParams?: InvoiceListParams) => Promise<void>;
  setPage: (page: number) => void;
  setSort: (sort: InvoiceSortOption) => void;
  setSearch: (q: string) => void;
  setStatusFilter: (status: InvoiceStatus | undefined) => void;
  setClientFilter: (clientId: string | undefined) => void;
  setQuoteFilter: (quoteId: string | undefined) => void;
  setDateFilter: (dateFrom?: string, dateTo?: string) => void;
  setDueDateFilter: (dueDateFrom?: string, dueDateTo?: string) => void;
  refresh: () => Promise<void>;
  updateInvoiceStatus: (
    invoiceId: string,
    newStatus: InvoiceStatus
  ) => Promise<void>;
}

export interface UseInvoiceListReturn {
  state: UseInvoiceListState;
  actions: UseInvoiceListActions;
  params: InvoiceListParams;
}

export function useInvoiceList(
  initialParams: InvoiceListParams = {}
): UseInvoiceListReturn {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  const [params, setParams] = useState<InvoiceListParams>({
    page: 1,
    limit: 20,
    sort: 'createdAt_desc',
    ...initialParams,
  });

  const fetchInvoices = useCallback(
    async (newParams?: InvoiceListParams) => {
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
        if (finalParams.quoteId?.trim())
          searchParams.set('quoteId', finalParams.quoteId.trim());
        if (finalParams.dateFrom?.trim())
          searchParams.set('dateFrom', finalParams.dateFrom.trim());
        if (finalParams.dateTo?.trim())
          searchParams.set('dateTo', finalParams.dateTo.trim());
        if (finalParams.dueDateFrom?.trim())
          searchParams.set('dueDateFrom', finalParams.dueDateFrom.trim());
        if (finalParams.dueDateTo?.trim())
          searchParams.set('dueDateTo', finalParams.dueDateTo.trim());

        // 一覧表示では常にclient情報とitems情報を含める（金額計算に必要）
        searchParams.set('include', 'client,items,quote');

        const response = await fetch(
          `/api/invoices?${searchParams.toString()}`
        );

        if (!response.ok) {
          let errorMessage = '請求書の取得に失敗しました';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // JSON以外のレスポンスの場合はデフォルトメッセージを使用
          }
          throw new Error(errorMessage);
        }

        const data: InvoicesListResponse = await response.json();
        setInvoices(data.data);
        setPagination(data.pagination);

        // パラメータを更新
        if (newParams) {
          setParams(finalParams);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '請求書の取得に失敗しました';
        setError(message);
        // エラー時は既存の請求書データとページネーション状態を保持
      } finally {
        setIsLoading(false);
      }
    },
    [params]
  );

  const setPage = useCallback(
    (page: number) => {
      fetchInvoices({ page });
    },
    [fetchInvoices]
  );

  const setSort = useCallback(
    (sort: InvoiceSortOption) => {
      fetchInvoices({ sort, page: 1 }); // ソート変更時はページをリセット
    },
    [fetchInvoices]
  );

  const setSearch = useCallback(
    (q: string) => {
      fetchInvoices({ q, page: 1 }); // 検索時はページをリセット
    },
    [fetchInvoices]
  );

  const setStatusFilter = useCallback(
    (status: InvoiceStatus | undefined) => {
      fetchInvoices({ status, page: 1 }); // フィルタ変更時はページをリセット
    },
    [fetchInvoices]
  );

  const setClientFilter = useCallback(
    (clientId: string | undefined) => {
      fetchInvoices({ clientId, page: 1 });
    },
    [fetchInvoices]
  );

  const setQuoteFilter = useCallback(
    (quoteId: string | undefined) => {
      fetchInvoices({ quoteId, page: 1 });
    },
    [fetchInvoices]
  );

  const setDateFilter = useCallback(
    (dateFrom?: string, dateTo?: string) => {
      fetchInvoices({ dateFrom, dateTo, page: 1 });
    },
    [fetchInvoices]
  );

  const setDueDateFilter = useCallback(
    (dueDateFrom?: string, dueDateTo?: string) => {
      fetchInvoices({ dueDateFrom, dueDateTo, page: 1 });
    },
    [fetchInvoices]
  );

  const refresh = useCallback(() => {
    return fetchInvoices();
  }, [fetchInvoices]);

  const updateInvoiceStatus = useCallback(
    async (invoiceId: string, newStatus: InvoiceStatus) => {
      // ローカル状態を楽観的に更新
      setInvoices((currentInvoices) =>
        currentInvoices.map((invoice) =>
          invoice.id === invoiceId ? { ...invoice, status: newStatus } : invoice
        )
      );

      try {
        const response = await fetch(`/api/invoices/${invoiceId}`, {
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
          setInvoices((currentInvoices) =>
            currentInvoices.map((inv) =>
              inv.id === updated.id ? updated : inv
            )
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
    void fetchInvoices();
  }, [fetchInvoices]);

  return {
    state: {
      invoices,
      isLoading,
      error,
      pagination,
    },
    actions: {
      fetchInvoices,
      setPage,
      setSort,
      setSearch,
      setStatusFilter,
      setClientFilter,
      setQuoteFilter,
      setDateFilter,
      setDueDateFilter,
      refresh,
      updateInvoiceStatus,
    },
    params,
  };
}

// Invoice Delete Hook Types
export interface UseInvoiceDeleteState {
  isDeleting: boolean;
  deleteError?: string;
}

export interface UseInvoiceDeleteActions {
  deleteInvoice: (invoice: Invoice) => Promise<boolean>;
  clearError: () => void;
}

export interface UseInvoiceDeleteReturn
  extends UseInvoiceDeleteState,
    UseInvoiceDeleteActions {}

export function useInvoiceDelete(): UseInvoiceDeleteReturn {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();

  const deleteInvoice = useCallback(
    async (invoice: Invoice): Promise<boolean> => {
      setIsDeleting(true);
      setDeleteError(undefined);

      try {
        const response = await fetch(`/api/invoices/${invoice.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          let errorMessage = '請求書の削除に失敗しました';
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
          err instanceof Error ? err.message : '請求書の削除に失敗しました';
        setDeleteError(message);
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setDeleteError(undefined);
  }, []);

  return {
    isDeleting,
    deleteError,
    deleteInvoice,
    clearError,
  };
}

// Invoice Status Change Hook
export function useInvoiceStatusChange() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string>();

  const changeStatus = useCallback(
    async (invoiceId: string, newStatus: InvoiceStatus): Promise<void> => {
      setIsUpdating(true);
      setStatusError(undefined);

      try {
        const response = await fetch(`/api/invoices/${invoiceId}`, {
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
