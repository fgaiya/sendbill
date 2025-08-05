import React from 'react';

import { Controller, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FormFieldWrapper } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { CompanyFormData } from '@/lib/features/settings/company';
import { useAddressFromPostalCode } from '@/lib/shared/hooks';
import { formatPhoneNumber } from '@/lib/shared/utils/phone';

import type { Control, FieldErrors, UseFormSetValue } from 'react-hook-form';

interface CompanyContactInfoFieldsProps {
  control: Control<CompanyFormData>;
  errors: FieldErrors<CompanyFormData>;
  isSubmitting: boolean;
  setValue: UseFormSetValue<CompanyFormData>;
}

export function CompanyContactInfoFields({
  control,
  errors,
  isSubmitting,
  setValue,
}: CompanyContactInfoFieldsProps) {
  const postalCodeValue = useWatch({
    control,
    name: 'postalCode',
  });

  const {
    isFetching: isAddressFetching,
    error: addressError,
    handleFetchAddress,
  } = useAddressFromPostalCode(setValue, {
    prefecture: 'prefecture',
    city: 'city',
    street: 'street',
  });

  const onFetchAddress = () => handleFetchAddress(postalCodeValue || '');

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">連絡先情報</h3>

      {/* 郵便番号 */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Controller
            control={control}
            name="postalCode"
            render={({ field }) => (
              <FormFieldWrapper
                label="郵便番号"
                id="postalCode"
                error={errors.postalCode?.message || addressError}
              >
                <Input
                  {...field}
                  id="postalCode"
                  placeholder="000-0000"
                  disabled={isSubmitting}
                />
              </FormFieldWrapper>
            )}
          />
        </div>
        <div className="pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onFetchAddress}
            disabled={isSubmitting || isAddressFetching || !postalCodeValue}
          >
            {isAddressFetching && <Spinner size="sm" className="mr-2" />}
            住所取得
          </Button>
        </div>
      </div>

      {/* 都道府県 */}
      <Controller
        control={control}
        name="prefecture"
        render={({ field }) => (
          <FormFieldWrapper
            label="都道府県"
            id="prefecture"
            error={errors.prefecture?.message}
          >
            <Input
              {...field}
              id="prefecture"
              placeholder="東京都"
              disabled={isSubmitting}
            />
          </FormFieldWrapper>
        )}
      />

      {/* 市区町村 */}
      <Controller
        control={control}
        name="city"
        render={({ field }) => (
          <FormFieldWrapper
            label="市区町村"
            id="city"
            error={errors.city?.message}
          >
            <Input
              {...field}
              id="city"
              placeholder="渋谷区"
              disabled={isSubmitting}
            />
          </FormFieldWrapper>
        )}
      />

      {/* 番地・建物名 */}
      <Controller
        control={control}
        name="street"
        render={({ field }) => (
          <FormFieldWrapper
            label="番地・建物名"
            id="street"
            error={errors.street?.message}
          >
            <Input
              {...field}
              id="street"
              placeholder="渋谷1-1-1 渋谷ビル101号"
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
            description="自動でハイフンが挿入されます"
          >
            <Input
              {...field}
              id="phone"
              placeholder="03-1234-5678"
              disabled={isSubmitting}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                field.onChange(formatted);
              }}
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
