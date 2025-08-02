'use client';

import React from 'react';

import { Controller } from 'react-hook-form';

import { FormFieldWrapper } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { ClientFormData } from '@/lib/domains/clients/types';

import type { Control, FieldErrors } from 'react-hook-form';

interface ClientContactInfoFieldsProps {
  control: Control<ClientFormData>;
  errors: FieldErrors<ClientFormData>;
  isSubmitting: boolean;
}

export function ClientContactInfoFields({
  control,
  errors,
  isSubmitting,
}: ClientContactInfoFieldsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        担当者・連絡先情報（任意）
      </h3>

      {/* 担当者名 */}
      <Controller
        control={control}
        name="contactName"
        render={({ field }) => (
          <FormFieldWrapper
            label="担当者名"
            id="contactName"
            error={errors.contactName?.message}
          >
            <Input
              {...field}
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
        name="contactEmail"
        render={({ field }) => (
          <FormFieldWrapper
            label="担当者メールアドレス"
            id="contactEmail"
            error={errors.contactEmail?.message}
          >
            <Input
              {...field}
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
    </div>
  );
}
