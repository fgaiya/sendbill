import React from 'react';

import { Controller } from 'react-hook-form';

import { FormFieldWrapper } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { CompanyFormData } from '@/lib/features/settings/company';

import type { Control, FieldErrors } from 'react-hook-form';

interface CompanyBasicInfoFieldsProps {
  control: Control<CompanyFormData>;
  errors: FieldErrors<CompanyFormData>;
  isSubmitting: boolean;
}

export function CompanyBasicInfoFields({
  control,
  errors,
  isSubmitting,
}: CompanyBasicInfoFieldsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">基本情報</h3>

      {/* 会社名 */}
      <Controller
        control={control}
        name="companyName"
        render={({ field }) => (
          <FormFieldWrapper
            label="会社名"
            id="companyName"
            required
            error={errors.companyName?.message}
          >
            <Input
              {...field}
              id="companyName"
              placeholder="株式会社サンプル"
              disabled={isSubmitting}
            />
          </FormFieldWrapper>
        )}
      />

      {/* 屋号 */}
      <Controller
        control={control}
        name="businessName"
        render={({ field }) => (
          <FormFieldWrapper
            label="屋号"
            id="businessName"
            error={errors.businessName?.message}
            description="個人事業主の場合などに使用します（任意）"
          >
            <Input
              {...field}
              id="businessName"
              placeholder="サンプル商店"
              disabled={isSubmitting}
            />
          </FormFieldWrapper>
        )}
      />

      {/* 代表者名 */}
      <Controller
        control={control}
        name="representativeName"
        render={({ field }) => (
          <FormFieldWrapper
            label="代表者名"
            id="representativeName"
            error={errors.representativeName?.message}
          >
            <Input
              {...field}
              id="representativeName"
              placeholder="田中太郎"
              disabled={isSubmitting}
            />
          </FormFieldWrapper>
        )}
      />

      {/* ロゴURL */}
      <Controller
        control={control}
        name="logoUrl"
        render={({ field }) => (
          <FormFieldWrapper
            label="ロゴURL"
            id="logoUrl"
            error={errors.logoUrl?.message}
            description="会社ロゴの画像URLを入力してください（任意）"
          >
            <Input
              {...field}
              id="logoUrl"
              placeholder="https://example.com/logo.png"
              disabled={isSubmitting}
            />
          </FormFieldWrapper>
        )}
      />
    </div>
  );
}
