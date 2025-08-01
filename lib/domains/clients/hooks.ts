import { useState } from 'react';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setIsSubmitting(true);
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
        const errorData = await response.json();
        throw new Error(errorData.error || '取引先の登録に失敗しました');
      }

      setSubmitSuccess(true);

      // 3秒後にダッシュボードにリダイレクト
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '取引先の登録に失敗しました';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
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

  return {
    form,
    state: {
      isSubmitting,
      submitError,
      submitSuccess,
    },
    actions: {
      onSubmit,
      onReset,
      clearMessages,
    },
  };
}
