'use client';

import { useCallback, useMemo } from 'react';

import { Trash2 } from 'lucide-react';
import { Controller, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  calculateItemFromForm,
  formatCurrency,
  debounce,
} from '@/lib/domains/quotes/calculations';
import type { QuoteFormWithItemsData } from '@/lib/domains/quotes/form-schemas';
import { cn } from '@/lib/shared/utils/ui';

import type { Control, FieldErrors, UseFormSetValue } from 'react-hook-form';

export interface QuoteItemRowProps {
  index: number;
  control: Control<QuoteFormWithItemsData>;
  errors: FieldErrors<QuoteFormWithItemsData>;
  setValue: UseFormSetValue<QuoteFormWithItemsData>;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isSubmitting?: boolean;
  className?: string;
}

// 入力フィールドの順序
const fieldRefs = {
  description: 'description',
  quantity: 'quantity',
  unitPrice: 'unitPrice',
  discountAmount: 'discountAmount',
  unit: 'unit',
  sku: 'sku',
} as const;

const getNextField = (currentField: keyof typeof fieldRefs): string | null => {
  const fields = Object.keys(fieldRefs) as (keyof typeof fieldRefs)[];
  const currentIndex = fields.indexOf(currentField);
  return currentIndex < fields.length - 1
    ? (fields[currentIndex + 1] as string)
    : null;
};

export function QuoteItemRow({
  index,
  control,
  errors,
  setValue,
  onRemove,
  isSubmitting = false,
  className,
}: QuoteItemRowProps) {
  // ユーザー入力（全角/カンマ/中間入力）を数値に変換するユーティリティ
  const toNumber = (v: unknown): number => {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    if (typeof v !== 'string') return 0;
    // 全角→半角、カンマ→ドット
    const half = v
      .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
      .replace(/[，、]/g, '')
      .replace(/．/g, '.');
    const n = Number(half);
    return Number.isFinite(n) ? n : 0;
  };
  // 現在の品目の値をwatchで取得
  const watchedItem = useWatch({
    control,
    name: `items.${index}`,
  });

  // デバウンス付き小計計算
  const debouncedCalculation = useMemo(
    () =>
      debounce(() => {
        const unitPrice = toNumber(watchedItem?.unitPrice);
        const quantity = toNumber(watchedItem?.quantity);
        const discountAmount = toNumber(watchedItem?.discountAmount);

        try {
          const result = calculateItemFromForm({
            unitPrice,
            quantity,
            discountAmount,
          });
          setValue(`items.${index}.subtotal`, result.netAmount, {
            shouldValidate: false,
            shouldDirty: false,
            shouldTouch: false,
          });
        } catch {
          setValue(`items.${index}.subtotal`, 0, {
            shouldValidate: false,
            shouldDirty: false,
            shouldTouch: false,
          });
        }
      }, 300),
    [
      watchedItem?.unitPrice,
      watchedItem?.quantity,
      watchedItem?.discountAmount,
      setValue,
      index,
    ]
  );

  const triggerCalculation = useCallback(() => {
    debouncedCalculation();
  }, [debouncedCalculation]);

  const handleKeyDown = useCallback(
    (
      event: React.KeyboardEvent<HTMLInputElement>,
      fieldName: keyof typeof fieldRefs
    ) => {
      const { key } = event;

      if (key === 'Enter') {
        event.preventDefault();
        const nextField = getNextField(fieldName);
        if (nextField) {
          const nextInput = document.querySelector(
            `input[name="items.${index}.${nextField}"]`
          ) as HTMLInputElement | null;
          nextInput?.focus();
        }
      } else if (key === 'Tab') {
        return;
      } else if (key === 'Delete' && event.ctrlKey) {
        event.preventDefault();
        onRemove();
      }
    },
    [index, onRemove]
  );

  const itemErrors = errors.items?.[index];

  return (
    <tr className={cn('hover:bg-gray-50 group', className)}>
      {/* 品目名 */}
      <td className="px-3 py-2 border-b border-gray-200">
        <Controller
          name={`items.${index}.description`}
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id={`items.${index}.description`}
              placeholder="商品・サービス名"
              disabled={isSubmitting}
              className={cn(
                'h-8 text-sm bg-white border border-gray-200 hover:border-input focus:border-input focus:bg-white',
                itemErrors?.description && 'border-red-300 focus:border-red-500'
              )}
              onKeyDown={(e) => handleKeyDown(e, 'description')}
            />
          )}
        />
        {itemErrors?.description && (
          <p className="text-xs text-red-600 mt-1">
            {itemErrors.description.message}
          </p>
        )}
      </td>

      {/* 数量 */}
      <td className="px-3 py-2 border-b border-gray-200 w-28 min-w-[7rem]">
        <Controller
          name={`items.${index}.quantity`}
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id={`items.${index}.quantity`}
              type="number"
              inputMode="decimal"
              step="0.001"
              min="0"
              placeholder="1.0"
              disabled={isSubmitting}
              value={field.value ?? ''}
              className={cn(
                'h-8 text-sm text-right font-mono bg-gray-50 border border-gray-200 hover:border-input focus:border-input focus:bg-white pr-8',
                itemErrors?.quantity && 'border-red-300 focus:border-red-500'
              )}
              onChange={(e) => {
                field.onChange(e.target.value);
                triggerCalculation();
              }}
              onKeyDown={(e) => handleKeyDown(e, 'quantity')}
            />
          )}
        />
        {itemErrors?.quantity && (
          <p className="text-xs text-red-600 mt-1">
            {itemErrors.quantity.message}
          </p>
        )}
      </td>

      {/* 単価 */}
      <td className="px-3 py-2 border-b border-gray-200 w-36 min-w-[9rem]">
        <Controller
          name={`items.${index}.unitPrice`}
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id={`items.${index}.unitPrice`}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0"
              disabled={isSubmitting}
              value={field.value ?? ''}
              className={cn(
                'h-8 text-sm text-right font-mono bg-gray-50 border border-gray-200 hover:border-input focus:border-input focus:bg-white pr-8',
                itemErrors?.unitPrice && 'border-red-300 focus:border-red-500'
              )}
              onChange={(e) => {
                field.onChange(e.target.value);
                triggerCalculation();
              }}
              onKeyDown={(e) => handleKeyDown(e, 'unitPrice')}
            />
          )}
        />
        {itemErrors?.unitPrice && (
          <p className="text-xs text-red-600 mt-1">
            {itemErrors.unitPrice.message}
          </p>
        )}
      </td>

      {/* 割引額 */}
      <td className="px-3 py-2 border-b border-gray-200 w-36 min-w-[9rem]">
        <Controller
          name={`items.${index}.discountAmount`}
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id={`items.${index}.discountAmount`}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0"
              disabled={isSubmitting}
              value={field.value ?? ''}
              className={cn(
                'h-8 text-sm text-right font-mono bg-gray-50 border border-gray-200 hover:border-input focus:border-input focus:bg-white pr-8',
                itemErrors?.discountAmount &&
                  'border-red-300 focus:border-red-500'
              )}
              onChange={(e) => {
                field.onChange(e.target.value);
                triggerCalculation();
              }}
              onKeyDown={(e) => handleKeyDown(e, 'discountAmount')}
            />
          )}
        />
        {itemErrors?.discountAmount && (
          <p className="text-xs text-red-600 mt-1">
            {itemErrors.discountAmount.message}
          </p>
        )}
      </td>

      {/* 単位 */}
      <td className="px-3 py-2 border-b border-gray-200 w-24 min-w-[6rem]">
        <Controller
          name={`items.${index}.unit`}
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id={`items.${index}.unit`}
              placeholder="個/kg/時間"
              disabled={isSubmitting}
              value={field.value || ''}
              className={cn(
                'h-8 text-sm text-center bg-white border border-gray-200 hover:border-input focus:border-input focus:bg-white pr-2'
              )}
              onKeyDown={(e) => handleKeyDown(e, 'unit')}
            />
          )}
        />
      </td>

      {/* SKU */}
      <td className="px-3 py-2 border-b border-gray-200 w-28 min-w-[7rem]">
        <Controller
          name={`items.${index}.sku`}
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id={`items.${index}.sku`}
              placeholder="商品コード"
              disabled={isSubmitting}
              value={field.value || ''}
              className={cn(
                'h-8 text-sm font-mono bg-white border border-gray-200 hover:border-input focus:border-input focus:bg-white pr-2'
              )}
              onKeyDown={(e) => handleKeyDown(e, 'sku')}
            />
          )}
        />
      </td>

      {/* 小計（読み取り専用） */}
      <td className="px-3 py-2 border-b border-gray-200 w-32">
        <Controller
          name={`items.${index}.subtotal`}
          control={control}
          render={({ field }) => (
            <div className="h-8 flex items-center justify-end text-sm font-mono font-semibold text-gray-900 bg-blue-50 rounded px-2 border border-blue-200">
              {formatCurrency(field.value || 0)}
            </div>
          )}
        />
      </td>

      {/* アクション */}
      <td className="px-3 py-2 border-b border-gray-200 w-16">
        <div className="flex items-center justify-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={isSubmitting}
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-600 transition-opacity"
            title="品目を削除 (Ctrl+Delete)"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
