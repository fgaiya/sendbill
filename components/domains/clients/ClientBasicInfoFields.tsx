'use client';

import React from 'react';

import { Controller } from 'react-hook-form';

import { FormFieldWrapper } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { ClientFormData } from '@/lib/domains/clients/types';

import type { Control, FieldErrors } from 'react-hook-form';

interface ClientBasicInfoFieldsProps {
  control: Control<ClientFormData>;
  errors: FieldErrors<ClientFormData>;
  isSubmitting: boolean;
}

export function ClientBasicInfoFields({
  control,
  errors,
  isSubmitting,
}: ClientBasicInfoFieldsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">基本情報</h3>

      {/* 取引先名（必須） */}
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <FormFieldWrapper
            label="取引先名"
            id="name"
            required
            error={errors.name?.message}
          >
            <Input
              {...field}
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
    </div>
  );
}
