'use client';

import React, { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormReturn, type Resolver } from 'react-hook-form';
import { toast } from 'sonner';

import { toApiDateString } from '@/lib/shared/utils/date';
import { omitUndefined } from '@/lib/shared/utils/objects';

import { quoteFormWithItemsSchema } from './form-schemas';
import { type QuoteFormWithItemsData } from './form-schemas';

import type { Quote } from './types';

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
    mode: 'onBlur',
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

        const quoteData = await response.json();
        if (isMounted) {
          setQuote(quoteData);

          // フォームの初期値を設定
          reset(toFormValuesFromQuote(quoteData));
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

      // API送信用のデータを正規化（日付のタイムゾーン対応、空文字列のnull化）
      const payload = {
        ...basicQuoteData,
        issueDate: toApiDateString(basicQuoteData.issueDate)!,
        expiryDate: toApiDateString(basicQuoteData.expiryDate),
        notes: basicQuoteData.notes?.trim() || null,
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
      const savedQuoteId = responseData.data?.id || quoteId;
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
              description: item.description.trim(),
              quantity: Number(item.quantity) || 0,
              unitPrice: Number(item.unitPrice) || 0,
              taxCategory: item.taxCategory,
              taxRate:
                item.taxRate !== undefined
                  ? Number(item.taxRate) || 0
                  : undefined,
              discountAmount: Number(item.discountAmount) || 0,
              unit: item.unit?.trim() || undefined,
              sku: item.sku?.trim() || undefined,
              sortOrder: item.sortOrder,
            }));

          if (itemsPayload.length > 0) {
            const itemsResponse = await fetch(
              `/api/quotes/${savedQuoteId}/items`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  action: 'bulk',
                  data: itemsPayload,
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
      router.push('/dashboard'); // 今後見積書一覧ページに変更
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
