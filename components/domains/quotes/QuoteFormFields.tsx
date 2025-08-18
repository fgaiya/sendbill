'use client';

import {
  type Control,
  type FieldErrors,
  type UseFormSetValue,
} from 'react-hook-form';

import type { CompanyForCalculation } from '@/lib/domains/quotes/calculations';
import type { QuoteFormWithItemsData } from '@/lib/domains/quotes/form-schemas';

import { QuoteBasicInfoFields } from './QuoteBasicInfoFields';
import { QuoteItemsFieldArray } from './QuoteItemsFieldArray';

export interface QuoteFormFieldsProps {
  control: Control<QuoteFormWithItemsData>;
  errors: FieldErrors<QuoteFormWithItemsData>;
  setValue: UseFormSetValue<QuoteFormWithItemsData>;
  company?: CompanyForCalculation | null;
  isSubmitting: boolean;
}

export function QuoteFormFields({
  control,
  errors,
  setValue,
  company,
  isSubmitting,
}: QuoteFormFieldsProps) {
  return (
    <div className="space-y-8">
      {/* 基本情報セクション */}
      <QuoteBasicInfoFields
        control={control}
        errors={errors}
        setValue={setValue}
        isSubmitting={isSubmitting}
      />

      {/* 品目管理セクション */}
      <QuoteItemsFieldArray
        control={control}
        errors={errors}
        setValue={setValue}
        company={company}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
