import { useState, useEffect } from 'react';

import { useUser } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { companySchemas } from '@/lib/shared/forms';

import { getCompany, createCompany, updateCompany } from './service';

import {
  CompanyFormData,
  Company,
  DEFAULT_FORM_VALUES,
  SUCCESS_MESSAGE_DURATION,
  getFormDataFromCompany,
} from './index';

export function useCompanyForm() {
  const { user } = useUser();
  const [submitError, setSubmitError] = useState<string>();
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [existingCompany, setExistingCompany] = useState<Company | null>(null);

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchemas.create),
    defaultValues: DEFAULT_FORM_VALUES,
    mode: 'onBlur',
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = form;

  // 会社情報の取得
  useEffect(() => {
    const fetchCompany = async () => {
      if (!user) return;

      try {
        const company = await getCompany();
        if (company) {
          setExistingCompany(company);
          reset(getFormDataFromCompany(company));
        }
      } catch (error) {
        console.error('Company fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompany();
  }, [user, reset]);

  const onSubmit = async (data: CompanyFormData) => {
    try {
      setSubmitError(undefined);
      setSubmitSuccess(false);

      const savedCompany = existingCompany
        ? await updateCompany(existingCompany.id, data)
        : await createCompany(data);

      setExistingCompany(savedCompany);
      setSubmitSuccess(true);

      // 成功メッセージを自動で非表示
      setTimeout(() => setSubmitSuccess(false), SUCCESS_MESSAGE_DURATION);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '保存中にエラーが発生しました';
      setSubmitError(message);
    }
  };

  const handleReset = () => {
    reset(getFormDataFromCompany(existingCompany));
    setSubmitError(undefined);
    setSubmitSuccess(false);
  };

  return {
    // Form state
    control,
    handleSubmit,
    errors,
    isSubmitting,
    isValid,

    // UI state
    isLoading,
    submitError,
    submitSuccess,
    existingCompany,

    // Actions
    onSubmit,
    handleReset,
  };
}
