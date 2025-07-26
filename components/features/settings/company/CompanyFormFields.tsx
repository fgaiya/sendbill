import React from 'react';

import { Controller } from 'react-hook-form';

import { FormFieldWrapper } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { CompanyFormData } from '@/lib/features/settings/company';

import type { Control, FieldErrors } from 'react-hook-form';

interface CompanyFormFieldsProps {
  control: Control<CompanyFormData>;
  errors: FieldErrors<CompanyFormData>;
  isSubmitting: boolean;
}

export function CompanyFormFields({
  control,
  errors,
  isSubmitting,
}: CompanyFormFieldsProps) {
  return (
    <>
      {/* 基本情報 */}
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
                onChange={(e) => field.onChange(e.target.value)}
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
                onChange={(e) => field.onChange(e.target.value)}
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
                onChange={(e) => field.onChange(e.target.value)}
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
                onChange={(e) => field.onChange(e.target.value)}
              />
            </FormFieldWrapper>
          )}
        />
      </div>

      {/* 連絡先情報 */}
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
                onChange={(e) => field.onChange(e.target.value)}
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
                onChange={(e) => field.onChange(e.target.value)}
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
                onChange={(e) => field.onChange(e.target.value)}
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
                onChange={(e) => field.onChange(e.target.value)}
              />
            </FormFieldWrapper>
          )}
        />
      </div>

      {/* 銀行情報 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          銀行情報（任意）
        </h3>

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
                onChange={(e) => field.onChange(e.target.value)}
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
                onChange={(e) => field.onChange(e.target.value)}
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
                onChange={(e) => field.onChange(e.target.value)}
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
                onChange={(e) => field.onChange(e.target.value)}
              />
            </FormFieldWrapper>
          )}
        />
      </div>
    </>
  );
}
