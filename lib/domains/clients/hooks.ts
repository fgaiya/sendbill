import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { clientSchemas } from './schemas';
import { ClientFormData, UseClientFormReturn } from './types';

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
