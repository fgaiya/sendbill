import React from 'react';

import { Controller } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import type { TaxCategory } from '@/lib/domains/quotes/calculations';
import {
  TAX_RATE_CONSTRAINTS,
  getDefaultTaxRate,
  formatTaxRate,
  isTaxRateInputEnabled,
} from '@/lib/shared/constants/tax';
import { cn } from '@/lib/shared/utils/ui';

import type {
  Control,
  FieldErrors,
  FieldValues,
  FieldPath,
} from 'react-hook-form';

interface TaxRateInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  // フォーム関連
  control: Control<TFieldValues>;
  name: TName;
  errors?: FieldErrors<TFieldValues>;

  // 税区分・税率
  taxCategory: TaxCategory;
  standardTaxRate?: number;
  reducedTaxRate?: number;

  // UI設定
  disabled?: boolean;
  placeholder?: string;
  className?: string;

  // 表示設定
  showDefaultRate?: boolean;
  hideWhenDisabled?: boolean;
}

export function TaxRateInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  errors,
  taxCategory,
  standardTaxRate = 10,
  reducedTaxRate = 8,
  disabled = false,
  placeholder,
  className,
  showDefaultRate = true,
  hideWhenDisabled = true,
}: TaxRateInputProps<TFieldValues, TName>) {
  // 税率入力が有効かどうか
  const isInputEnabled = isTaxRateInputEnabled(taxCategory);
  const isActuallyDisabled = disabled || !isInputEnabled;

  // デフォルト税率の取得
  const defaultRate = getDefaultTaxRate(
    taxCategory,
    standardTaxRate,
    reducedTaxRate
  );

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

  // 非表示判定
  const shouldHide = hideWhenDisabled && !isInputEnabled;

  // プレースホルダーの決定
  const actualPlaceholder =
    placeholder || (showDefaultRate ? formatTaxRate(defaultRate) : '税率');

  if (shouldHide) {
    return null;
  }

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className={cn('space-y-1', className)}>
          <div className="relative">
            <Input
              {...field}
              type="number"
              inputMode="decimal"
              step={TAX_RATE_CONSTRAINTS.STEP}
              min={TAX_RATE_CONSTRAINTS.MIN}
              max={TAX_RATE_CONSTRAINTS.MAX}
              placeholder={actualPlaceholder}
              disabled={isActuallyDisabled}
              value={field.value ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                field.onChange(value === '' ? undefined : Number(value));
              }}
              className={cn(
                'h-8 text-sm text-right font-mono pr-8',
                isInputEnabled
                  ? 'bg-gray-50 border border-gray-200 hover:border-input focus:border-input focus:bg-white'
                  : 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed',
                errorMessage &&
                  isInputEnabled &&
                  'border-red-300 focus:border-red-500'
              )}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              %
            </span>
          </div>

          {/* エラーメッセージ */}
          {errorMessage && isInputEnabled && (
            <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
          )}

          {/* デフォルト税率の説明 */}
          {showDefaultRate && isInputEnabled && (
            <p className="text-xs text-gray-500 mt-1">
              空白時は {formatTaxRate(defaultRate)} が適用されます
            </p>
          )}

          {/* 無効時の説明 */}
          {!isInputEnabled && !hideWhenDisabled && (
            <p className="text-xs text-gray-500 mt-1">
              {taxCategory === 'EXEMPT'
                ? '免税のため税率0%'
                : '非課税のため税率0%'}
            </p>
          )}
        </div>
      )}
    />
  );
}

/**
 * シンプルな税率入力（Controller不使用）
 */
interface SimpleTaxRateInputProps {
  value?: number;
  onChange: (value: number | undefined) => void;
  taxCategory: TaxCategory;
  defaultRate?: number;
  disabled?: boolean;
  className?: string;
}

export function SimpleTaxRateInput({
  value,
  onChange,
  taxCategory,
  defaultRate = 10,
  disabled = false,
  className,
}: SimpleTaxRateInputProps) {
  const isInputEnabled = isTaxRateInputEnabled(taxCategory);
  const isActuallyDisabled = disabled || !isInputEnabled;

  if (!isInputEnabled) {
    return (
      <div className={cn('relative', className)}>
        <Input
          value="0"
          disabled
          className="h-8 text-sm text-right font-mono pr-8 bg-gray-100 text-gray-500"
        />
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
          %
        </span>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <Input
        type="number"
        inputMode="decimal"
        step={TAX_RATE_CONSTRAINTS.STEP}
        min={TAX_RATE_CONSTRAINTS.MIN}
        max={TAX_RATE_CONSTRAINTS.MAX}
        placeholder={formatTaxRate(defaultRate)}
        disabled={isActuallyDisabled}
        value={value ?? ''}
        onChange={(e) => {
          const inputValue = e.target.value;
          onChange(inputValue === '' ? undefined : Number(inputValue));
        }}
        className="h-8 text-sm text-right font-mono pr-8 bg-gray-50 border border-gray-200 hover:border-input focus:border-input focus:bg-white"
      />
      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
        %
      </span>
    </div>
  );
}
