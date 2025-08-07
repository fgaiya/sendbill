'use client';

import React from 'react';

import { Controller } from 'react-hook-form';

import { FormFieldWrapper } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';

import type { Control, FieldValues, Path, FieldErrors } from 'react-hook-form';

interface ClientBasicInfoFieldsProps<T extends FieldValues> {
  control: Control<T>;
  errors: FieldErrors<T>;
  isSubmitting: boolean;
}

export function ClientBasicInfoFields<T extends FieldValues>({
  control,
  errors,
  isSubmitting,
}: ClientBasicInfoFieldsProps<T>) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">基本情報</h3>

      {/* 取引先名（必須） */}
      <Controller
        control={control}
        name={'name' as Path<T>}
        render={({ field }) => (
          <FormFieldWrapper
            label="取引先名"
            id="name"
            required
            error={errors.name?.message as string}
          >
            <Input
              {...field}
              value={field.value || ''}
              id="name"
              placeholder="株式会社サンプル"
              disabled={isSubmitting}
            />
          </FormFieldWrapper>
        )}
      />

      {/* 住所 */}
      <Controller
        control={control}
        name={'address' as Path<T>}
        render={({ field }) => (
          <FormFieldWrapper
            label="住所"
            id="address"
            error={errors.address?.message as string}
          >
            <Input
              {...field}
              value={field.value || ''}
              id="address"
              placeholder="東京都渋谷区..."
              disabled={isSubmitting}
            />
          </FormFieldWrapper>
        )}
      />
    </div>
  );
}
