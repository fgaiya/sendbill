'use client';

import { useEffect } from 'react';

import { useFieldArray } from 'react-hook-form';

import type { CompanyForCalculation } from '@/lib/domains/quotes/calculations';
import type { QuoteFormWithItemsData } from '@/lib/domains/quotes/form-schemas';

import { QuoteItemTable } from './QuoteItemTable';

import type { Control, FieldErrors, UseFormSetValue } from 'react-hook-form';

export interface QuoteItemsFieldArrayProps {
  control: Control<QuoteFormWithItemsData>;
  errors: FieldErrors<QuoteFormWithItemsData>;
  setValue: UseFormSetValue<QuoteFormWithItemsData>;
  company?: CompanyForCalculation | null;
  isSubmitting?: boolean;
  className?: string;
}

export function QuoteItemsFieldArray({
  control,
  errors,
  setValue,
  company,
  isSubmitting = false,
  className,
}: QuoteItemsFieldArrayProps) {
  // useFieldArray フックで品目配列を管理
  const fieldArray = useFieldArray({
    control,
    name: 'items',
    keyName: 'keyId',
  });

  const { fields } = fieldArray;

  // フォーム送信前のバリデーション前処理
  useEffect(() => {
    // 品目の sortOrder を自動更新
    fields.forEach((_, index) => {
      setValue(`items.${index}.sortOrder`, index, {
        shouldValidate: false,
        shouldDirty: false,
        shouldTouch: false,
      });
    });
  }, [fields, setValue]);

  return (
    <QuoteItemTable
      control={control}
      errors={errors}
      setValue={setValue}
      fieldArray={fieldArray}
      company={company}
      isSubmitting={isSubmitting}
      className={className}
    />
  );
}
