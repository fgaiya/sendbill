'use client';

import type { InvoiceFormWithPaymentData } from '@/lib/domains/invoices/form-schemas';
import type { CompanyWithBankInfo } from '@/lib/domains/invoices/types';

import { InvoiceBasicInfoFields } from './InvoiceBasicInfoFields';
import { InvoiceItemsFieldArray } from './InvoiceItemsFieldArray';
import { InvoicePaymentFields } from './InvoicePaymentFields';

import type { Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
export interface InvoiceFormFieldsProps {
  control: Control<InvoiceFormWithPaymentData>;
  errors: FieldErrors<InvoiceFormWithPaymentData>;
  setValue: UseFormSetValue<InvoiceFormWithPaymentData>;
  company: CompanyWithBankInfo | null;
  isSubmitting: boolean;
}

export function InvoiceFormFields({
  control,
  errors,
  setValue,
  company,
  isSubmitting,
}: InvoiceFormFieldsProps) {
  return (
    <div className="space-y-8">
      {/* 基本情報セクション */}
      <InvoiceBasicInfoFields<InvoiceFormWithPaymentData>
        control={control}
        errors={errors}
        setValue={setValue}
        company={company}
        isSubmitting={isSubmitting}
      />

      {/* 支払情報セクション */}
      <InvoicePaymentFields
        control={control}
        errors={errors}
        company={company}
        isSubmitting={isSubmitting}
      />

      {/* 品目管理セクション */}
      <InvoiceItemsFieldArray
        control={control}
        errors={errors}
        setValue={setValue}
        company={company}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
