import React from 'react';

import { Controller } from 'react-hook-form';

import { FormFieldWrapper } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { CompanyFormData } from '@/lib/features/settings/company';

import type { Control, FieldErrors } from 'react-hook-form';

interface CompanyContactInfoFieldsProps {
  control: Control<CompanyFormData>;
  errors: FieldErrors<CompanyFormData>;
  isSubmitting: boolean;
}

export function CompanyContactInfoFields({
  control,
  errors,
  isSubmitting,
}: CompanyContactInfoFieldsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">連絡先情報</h3>

      {/* 住所 */}
      <Controller
        control={control}
        name="address"
        render={({ field }) => (
          <FormFieldWrapper
            label="住所"
            id="address"
            error={errors.address?.message}
          >
            <Input
              {...field}
              id="address"
              placeholder="東京都渋谷区..."
              disabled={isSubmitting}
            />
          </FormFieldWrapper>
        )}
      />

      {/* 電話番号 */}
      <Controller
        control={control}
        name="phone"
        render={({ field }) => (
          <FormFieldWrapper
            label="電話番号"
            id="phone"
            error={errors.phone?.message}
            description="ハイフンありまたはなしで入力してください"
          >
            <Input
              {...field}
              id="phone"
              placeholder="03-1234-5678"
              disabled={isSubmitting}
            />
          </FormFieldWrapper>
        )}
      />

      {/* 連絡先メール */}
      <Controller
        control={control}
        name="contactEmail"
        render={({ field }) => (
          <FormFieldWrapper
            label="連絡先メールアドレス"
            id="contactEmail"
            error={errors.contactEmail?.message}
          >
            <Input
              {...field}
              id="contactEmail"
              type="email"
              placeholder="contact@example.com"
              disabled={isSubmitting}
            />
          </FormFieldWrapper>
        )}
      />

      {/* 適格請求書登録番号 */}
      <Controller
        control={control}
        name="invoiceRegistrationNumber"
        render={({ field }) => (
          <FormFieldWrapper
            label="適格請求書登録番号"
            id="invoiceRegistrationNumber"
            error={errors.invoiceRegistrationNumber?.message}
            description="インボイス制度対応のため（任意）"
          >
            <Input
              {...field}
              id="invoiceRegistrationNumber"
              placeholder="T1234567890123"
              disabled={isSubmitting}
            />
          </FormFieldWrapper>
        )}
      />
    </div>
  );
}
