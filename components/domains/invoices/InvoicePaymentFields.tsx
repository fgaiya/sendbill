'use client';

import { Controller, type Control, type FieldErrors } from 'react-hook-form';

import { FormFieldWrapper } from '@/components/ui/form-field';
import type { InvoiceFormWithPaymentData } from '@/lib/domains/invoices/form-schemas';
import type { CompanyWithBankInfo } from '@/lib/domains/invoices/types';

export interface InvoicePaymentFieldsProps {
  control: Control<InvoiceFormWithPaymentData>;
  errors: FieldErrors<InvoiceFormWithPaymentData>;
  company: CompanyWithBankInfo | null;
  isSubmitting: boolean;
}

export function InvoicePaymentFields({
  control,
  errors,
  company,
  isSubmitting,
}: InvoicePaymentFieldsProps) {
  const toErrorMessage = (m: unknown): string | undefined =>
    typeof m === 'string' ? m : undefined;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">支払情報</h3>

      {/* 支払方法 */}
      <Controller<InvoiceFormWithPaymentData, 'paymentMethod'>
        control={control}
        name={'paymentMethod'}
        render={({ field }) => (
          <FormFieldWrapper
            label="支払方法"
            id="paymentMethod"
            required
            error={toErrorMessage(errors.paymentMethod?.message)}
          >
            <select
              {...field}
              value={field.value || 'BANK_TRANSFER'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              disabled={isSubmitting}
            >
              <option value="BANK_TRANSFER">銀行振込</option>
              <option value="CREDIT_CARD">クレジットカード</option>
              <option value="CASH">現金</option>
              <option value="CHECK">小切手</option>
            </select>
          </FormFieldWrapper>
        )}
      />

      {/* 振込先情報表示 */}
      {company &&
        (company.bankName ||
          company.bankBranch ||
          company.bankAccountNumber ||
          company.bankAccountHolder) && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium text-gray-900 mb-2">振込先情報</h4>
            <div className="text-sm text-gray-700 space-y-1">
              {company.bankName && <p>銀行名: {company.bankName}</p>}
              {company.bankBranch && <p>支店名: {company.bankBranch}</p>}
              {company.bankAccountNumber && (
                <p>口座番号: {company.bankAccountNumber}</p>
              )}
              {company.bankAccountHolder && (
                <p>口座名義: {company.bankAccountHolder}</p>
              )}
            </div>
          </div>
        )}

      {/* 支払条件 */}
      <Controller<InvoiceFormWithPaymentData, 'paymentTerms'>
        control={control}
        name={'paymentTerms'}
        render={({ field }) => (
          <FormFieldWrapper
            label="支払条件"
            id="paymentTerms"
            error={toErrorMessage(errors.paymentTerms?.message)}
          >
            <textarea
              {...field}
              value={field.value || ''}
              id="paymentTerms"
              placeholder="支払条件や特記事項があれば記入してください（例：月末締切翌月30日支払い）"
              disabled={isSubmitting}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />
          </FormFieldWrapper>
        )}
      />
    </div>
  );
}
