'use client';

import type { ChangeEvent } from 'react';

import {
  Controller,
  type Control,
  type FieldErrors,
  type FieldPath,
  type UseFormSetValue,
  type Path,
  type PathValue,
} from 'react-hook-form';

import { FormFieldWrapper } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import type { QuoteBasicsShape } from '@/lib/domains/quotes/types';
import { toDateInputValue, fromDateInputValue } from '@/lib/shared/utils/date';

import { ClientSelector } from './ClientSelector';

export interface QuoteBasicInfoFieldsProps<T extends QuoteBasicsShape> {
  control: Control<T>;
  errors: FieldErrors<T>;
  setValue: UseFormSetValue<T>;
  isSubmitting: boolean;
}

export function QuoteBasicInfoFields<T extends QuoteBasicsShape>({
  control,
  errors,
  setValue,
  isSubmitting,
}: QuoteBasicInfoFieldsProps<T>) {
  const toErrorMessage = (m: unknown): string | undefined =>
    typeof m === 'string' ? m : undefined;
  const toDateChange =
    (onChange: (value: unknown) => void) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const date = fromDateInputValue(e.target.value);
      onChange(date);
    };
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">基本情報</h3>

      {/* 取引先選択（必須） */}
      <Controller
        control={control}
        name={'clientId' as FieldPath<T>}
        render={({ field }) => (
          <FormFieldWrapper
            label="取引先"
            id="clientId"
            required
            error={toErrorMessage(errors.clientId?.message)}
          >
            <ClientSelector
              id="clientId"
              value={typeof field.value === 'string' ? field.value : ''}
              onChange={(client) => {
                if (client) {
                  field.onChange(client.id);
                  setValue(
                    'clientName' as Path<T>,
                    client.name as PathValue<T, Path<T>>,
                    {
                      shouldDirty: true,
                      shouldValidate: true,
                    }
                  );
                } else {
                  field.onChange('');
                  setValue(
                    'clientName' as Path<T>,
                    '' as PathValue<T, Path<T>>,
                    {
                      shouldDirty: true,
                      shouldValidate: true,
                    }
                  );
                }
              }}
              disabled={isSubmitting}
              placeholder="取引先を選択してください"
            />
          </FormFieldWrapper>
        )}
      />

      {/* 発行日（必須） */}
      <Controller
        control={control}
        name={'issueDate' as FieldPath<T>}
        render={({ field }) => (
          <FormFieldWrapper
            label="発行日"
            id="issueDate"
            required
            error={toErrorMessage(errors.issueDate?.message)}
          >
            <Input
              {...field}
              value={
                field.value instanceof Date ? toDateInputValue(field.value) : ''
              }
              onChange={toDateChange(field.onChange)}
              id="issueDate"
              type="date"
              disabled={isSubmitting}
            />
          </FormFieldWrapper>
        )}
      />

      {/* 有効期限（任意） */}
      <Controller
        control={control}
        name={'expiryDate' as FieldPath<T>}
        render={({ field }) => (
          <FormFieldWrapper
            label="有効期限"
            id="expiryDate"
            error={toErrorMessage(errors.expiryDate?.message)}
          >
            <Input
              {...field}
              value={
                field.value instanceof Date ? toDateInputValue(field.value) : ''
              }
              onChange={toDateChange(field.onChange)}
              id="expiryDate"
              type="date"
              disabled={isSubmitting}
              placeholder="有効期限を設定（任意）"
            />
          </FormFieldWrapper>
        )}
      />

      {/* 備考（任意） */}
      <Controller
        control={control}
        name={'notes' as FieldPath<T>}
        render={({ field }) => (
          <FormFieldWrapper
            label="備考"
            id="notes"
            error={toErrorMessage(errors.notes?.message)}
          >
            <textarea
              {...field}
              value={typeof field.value === 'string' ? field.value : ''}
              id="notes"
              placeholder="特記事項があれば記入してください"
              disabled={isSubmitting}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />
          </FormFieldWrapper>
        )}
      />
    </div>
  );
}
