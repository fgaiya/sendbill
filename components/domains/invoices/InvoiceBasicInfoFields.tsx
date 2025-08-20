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
import type {
  InvoiceBasicsShape,
  CompanyWithBankInfo,
} from '@/lib/domains/invoices/types';
import { toDateInputValue, fromDateInputValue } from '@/lib/shared/utils/date';

import { ClientSelector } from '../quotes/ClientSelector';

export interface InvoiceBasicInfoFieldsProps<T extends InvoiceBasicsShape> {
  control: Control<T>;
  errors: FieldErrors<T>;
  setValue: UseFormSetValue<T>;
  company: CompanyWithBankInfo | null;
  isSubmitting: boolean;
}

export function InvoiceBasicInfoFields<T extends InvoiceBasicsShape>({
  control,
  errors,
  setValue,
  company,
  isSubmitting,
}: InvoiceBasicInfoFieldsProps<T>) {
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

      {/* 支払期限（任意） */}
      <Controller
        control={control}
        name={'dueDate' as FieldPath<T>}
        render={({ field }) => (
          <FormFieldWrapper
            label="支払期限"
            id="dueDate"
            error={toErrorMessage(errors.dueDate?.message)}
          >
            <Input
              {...field}
              value={
                field.value instanceof Date ? toDateInputValue(field.value) : ''
              }
              onChange={toDateChange(field.onChange)}
              id="dueDate"
              type="date"
              disabled={isSubmitting}
              placeholder="支払期限を設定（任意）"
            />
          </FormFieldWrapper>
        )}
      />

      {/* 支払期限自動設定ボタン */}
      <div className="flex justify-start">
        <button
          type="button"
          onClick={() => {
            const issueDate = (control._formValues as { issueDate?: Date })
              ?.issueDate;
            if (issueDate instanceof Date) {
              const calculatedDueDate = new Date(issueDate);
              calculatedDueDate.setDate(calculatedDueDate.getDate() + 30);
              setValue(
                'dueDate' as Path<T>,
                calculatedDueDate as PathValue<T, Path<T>>,
                {
                  shouldDirty: true,
                  shouldValidate: true,
                }
              );
            }
          }}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          支払期限を30日後に設定
        </button>
      </div>

      {/* 請求書番号プレビュー（インボイス番号付き） */}
      <FormFieldWrapper label="請求書番号" id="invoiceNumberPreview">
        <div className="flex items-center space-x-2">
          <Input
            value={
              company
                ? `INV-${String((company.invoiceNumberSeq || 0) + 1).padStart(4, '0')}`
                : '番号未設定'
            }
            disabled={true}
            className="bg-blue-50 text-blue-700 font-mono flex-1"
            placeholder="番号を生成中..."
          />
          {company?.invoiceRegistrationNumber && (
            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
              T{company.invoiceRegistrationNumber}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          次回採番される請求書番号のプレビュー（実際の番号は送信時に自動採番されます）
        </p>
      </FormFieldWrapper>

      {/* 見積書ID（任意・隠しフィールド） */}
      {'quoteId' in control._defaultValues && (
        <Controller
          control={control}
          name={'quoteId' as FieldPath<T>}
          render={({ field }) => (
            <input
              type="hidden"
              {...field}
              value={typeof field.value === 'string' ? field.value : ''}
            />
          )}
        />
      )}

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
              placeholder="支払い条件や特記事項があれば記入してください"
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
