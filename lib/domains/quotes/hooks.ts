'use client';

import React, { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';

import { toApiDateString } from '@/lib/shared/utils/date';
import { omitUndefined } from '@/lib/shared/utils/objects';

import { quoteFormUiSchema } from './form-schemas';
import { type QuoteFormData } from './schemas';

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
  form: UseFormReturn<QuoteFormData, unknown, QuoteFormData>;
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
  const formSchema = quoteFormUiSchema;

  const defaultCreateValues: QuoteFormData = {
    clientId: '',
    issueDate: new Date(),
    expiryDate: undefined,
    notes: '',
  };

  const form = useForm<QuoteFormData, unknown, QuoteFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultCreateValues,
    mode: 'onBlur',
  });

  const toFormValuesFromQuote = (q: Quote): QuoteFormData => ({
    clientId: q.clientId,
    issueDate: new Date(q.issueDate),
    expiryDate: q.expiryDate ? new Date(q.expiryDate) : undefined,
    notes: q.notes || '',
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

  const onSubmit = async (data: QuoteFormData) => {
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

      // API送信用のデータを正規化（日付のタイムゾーン対応、空文字列のnull化）
      const payload = {
        ...data,
        issueDate: toApiDateString(data.issueDate)!,
        expiryDate: toApiDateString(data.expiryDate),
        notes: data.notes?.trim() || null,
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
