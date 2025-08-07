'use client';

import React from 'react';

import { Controller } from 'react-hook-form';

import { FormFieldWrapper } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';

import type { Control, FieldValues, Path, FieldErrors } from 'react-hook-form';

interface ClientContactInfoFieldsProps<T extends FieldValues> {
  control: Control<T>;
  errors: FieldErrors<T>;
  isSubmitting: boolean;
}

export function ClientContactInfoFields<T extends FieldValues>({
  control,
  errors,
  isSubmitting,
}: ClientContactInfoFieldsProps<T>) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        担当者・連絡先情報（任意）
      </h3>

      {/* 担当者名 */}
      <Controller
        control={control}
        name={'contactName' as Path<T>}
        render={({ field }) => (
          <FormFieldWrapper
            label="担当者名"
            id="contactName"
            error={errors.contactName?.message as string}
          >
            <Input
              {...field}
              value={field.value || ''}
              id="contactName"
              placeholder="田中太郎"
              disabled={isSubmitting}
            />
          </FormFieldWrapper>
        )}
      />

      {/* 担当者メールアドレス */}
      <Controller
        control={control}
        name={'contactEmail' as Path<T>}
        render={({ field }) => (
          <FormFieldWrapper
            label="担当者メールアドレス"
            id="contactEmail"
            error={errors.contactEmail?.message as string}
          >
            <Input
              {...field}
              value={field.value || ''}
              id="contactEmail"
              type="email"
              placeholder="tanaka@example.com"
              disabled={isSubmitting}
            />
          </FormFieldWrapper>
        )}
      />

      {/* 電話番号 */}
      <Controller
        control={control}
        name={'phone' as Path<T>}
        render={({ field }) => (
          <FormFieldWrapper
            label="電話番号"
            id="phone"
            error={errors.phone?.message as string}
            description="ハイフンありまたはなしで入力してください"
          >
            <Input
              {...field}
              value={field.value || ''}
              id="phone"
              placeholder="03-1234-5678"
              disabled={isSubmitting}
            />
          </FormFieldWrapper>
        )}
      />
    </div>
  );
}
