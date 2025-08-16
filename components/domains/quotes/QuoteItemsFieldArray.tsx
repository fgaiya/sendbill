'use client';

import { useEffect } from 'react';

import { useFieldArray } from 'react-hook-form';

import type { QuoteFormWithItemsData } from '@/lib/domains/quotes/form-schemas';

import { QuoteItemTable } from './QuoteItemTable';

import type { Control, FieldErrors, UseFormSetValue } from 'react-hook-form';

export interface QuoteItemsFieldArrayProps {
  control: Control<QuoteFormWithItemsData>;
  errors: FieldErrors<QuoteFormWithItemsData>;
  setValue: UseFormSetValue<QuoteFormWithItemsData>;
  isSubmitting?: boolean;
  className?: string;
}

export function QuoteItemsFieldArray({
  control,
  errors,
  setValue,
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

  // パフォーマンス最適化：初期化時に最低1件の品目を追加
  useEffect(() => {
    if (fields.length === 0) {
      fieldArray.append({
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxCategory: 'STANDARD',
        taxRate: undefined,
        discountAmount: 0,
        unit: '',
        sku: '',
        sortOrder: 0,
        subtotal: 0,
      });
    }
  }, [fieldArray, fields.length]);

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
      isSubmitting={isSubmitting}
      className={className}
    />
  );
}
