import React, { useMemo } from 'react';

import { Controller } from 'react-hook-form';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TaxCategory } from '@/lib/domains/quotes/calculations';
import {
  TAX_CATEGORY_OPTIONS,
  getDefaultTaxRate,
  formatTaxRate,
} from '@/lib/shared/constants/tax';
import { cn } from '@/lib/shared/utils/ui';

import type {
  Control,
  FieldErrors,
  FieldValues,
  FieldPath,
} from 'react-hook-form';

interface TaxCategorySelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  // フォーム関連
  control: Control<TFieldValues>;
  name: TName;
  errors?: FieldErrors<TFieldValues>;

  // 税率表示用
  standardTaxRate?: number;
  reducedTaxRate?: number;

  // UI設定
  disabled?: boolean;
  placeholder?: string;
  className?: string;

  // カスタマイズ
  showDescription?: boolean;
  showTaxRate?: boolean;
}

export function TaxCategorySelect<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  errors,
  standardTaxRate = 10,
  reducedTaxRate = 8,
  disabled = false,
  placeholder = '税区分を選択',
  className,
  showDescription = true,
  showTaxRate = true,
}: TaxCategorySelectProps<TFieldValues, TName>) {
  // 税率を含むオプション生成
  const optionsWithTaxRate = useMemo(() => {
    return TAX_CATEGORY_OPTIONS.map((option) => {
      const taxRate = getDefaultTaxRate(
        option.value,
        standardTaxRate,
        reducedTaxRate
      );

      return {
        ...option,
        taxRate,
        displayLabel: showTaxRate
          ? `${option.label} (${formatTaxRate(taxRate)})`
          : option.label,
      };
    });
  }, [standardTaxRate, reducedTaxRate, showTaxRate]);

  // エラーメッセージの取得（ネストされたパス対応）
  const getNestedError = (
    errors: FieldErrors<TFieldValues> | undefined,
    path: string
  ): string | undefined => {
    if (!errors) return undefined;

    const keys = path.split('.');
    let current: unknown = errors;

    for (const key of keys) {
      if (!current || typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[key];
    }

    if (current && typeof current === 'object' && 'message' in current) {
      const message = (current as { message?: string }).message;
      return typeof message === 'string' ? message : undefined;
    }

    return current ? String(current) : undefined;
  };

  const errorMessage = getNestedError(errors, name);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className={cn('space-y-1', className)}>
          <Select
            value={field.value || ''}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <SelectTrigger
              className={cn(
                'h-8 text-sm bg-gray-50 border border-gray-200 hover:border-input focus:border-input focus:bg-white',
                errorMessage && 'border-red-300 focus:border-red-500'
              )}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {optionsWithTaxRate.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="py-2"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-base">{option.emoji}</span>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {option.displayLabel}
                      </span>
                      {showDescription && (
                        <span className="text-xs text-gray-500">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {errorMessage && (
            <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
          )}
        </div>
      )}
    />
  );
}

/**
 * 簡単な税区分選択（ラベルのみ）
 */
interface SimpleTaxCategorySelectProps {
  value: TaxCategory;
  onChange: (value: TaxCategory) => void;
  disabled?: boolean;
  className?: string;
}

export function SimpleTaxCategorySelect({
  value,
  onChange,
  disabled = false,
  className,
}: SimpleTaxCategorySelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(newValue) => onChange(newValue as TaxCategory)}
      disabled={disabled}
    >
      <SelectTrigger className={cn('h-8 text-sm', className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TAX_CATEGORY_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center space-x-2">
              <span>{option.emoji}</span>
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
