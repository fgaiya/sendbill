import React from 'react';

import { Controller } from 'react-hook-form';

import { FormFieldWrapper } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { CompanyFormData } from '@/lib/features/settings/company';

import type { Control, FieldErrors } from 'react-hook-form';

interface CompanyBankInfoFieldsProps {
  control: Control<CompanyFormData>;
  errors: FieldErrors<CompanyFormData>;
  isSubmitting: boolean;
}

export function CompanyBankInfoFields({
  control,
  errors,
  isSubmitting,
}: CompanyBankInfoFieldsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">銀行情報（任意）</h3>

      {/* 銀行名 */}
      <Controller
        control={control}
        name="bankName"
        render={({ field }) => (
          <FormFieldWrapper
            label="銀行名"
            id="bankName"
            error={errors.bankName?.message}
          >
            <Input
              {...field}
              id="bankName"
              placeholder="○○銀行"
              disabled={isSubmitting}
            />
          </FormFieldWrapper>
        )}
      />

      {/* 支店名 */}
      <Controller
        control={control}
        name="bankBranch"
        render={({ field }) => (
          <FormFieldWrapper
            label="支店名"
            id="bankBranch"
            error={errors.bankBranch?.message}
          >
            <Input
              {...field}
              id="bankBranch"
              placeholder="○○支店"
              disabled={isSubmitting}
            />
          </FormFieldWrapper>
        )}
      />

      {/* 口座番号 */}
      <Controller
        control={control}
        name="bankAccountNumber"
        render={({ field }) => (
          <FormFieldWrapper
            label="口座番号"
            id="bankAccountNumber"
            error={errors.bankAccountNumber?.message}
          >
            <Input
              {...field}
              id="bankAccountNumber"
              placeholder="1234567"
              disabled={isSubmitting}
            />
          </FormFieldWrapper>
        )}
      />

      {/* 口座名義 */}
      <Controller
        control={control}
        name="bankAccountHolder"
        render={({ field }) => (
          <FormFieldWrapper
            label="口座名義"
            id="bankAccountHolder"
            error={errors.bankAccountHolder?.message}
          >
            <Input
              {...field}
              id="bankAccountHolder"
              placeholder="カ）サンプル"
              disabled={isSubmitting}
            />
          </FormFieldWrapper>
        )}
      />
    </div>
  );
}
