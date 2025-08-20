'use client';

import {
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useRef,
} from 'react';

import { Trash2 } from 'lucide-react';
import { Controller, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { InvoiceFormWithPaymentData } from '@/lib/domains/invoices/form-schemas';
import {
  calculateItemTax,
  type CompanyForCalculation,
} from '@/lib/domains/quotes/calculations';
import { formatCurrency } from '@/lib/shared/utils';
import { cn } from '@/lib/shared/utils/ui';

import { TaxCategorySelect } from '../quotes/TaxCategorySelect';
import { TaxRateInput } from '../quotes/TaxRateInput';

import type { Control, FieldErrors, UseFormSetValue } from 'react-hook-form';

export interface InvoiceItemRowProps {
  index: number;
  control: Control<InvoiceFormWithPaymentData>;
  errors: FieldErrors<InvoiceFormWithPaymentData>;
  setValue: UseFormSetValue<InvoiceFormWithPaymentData>;
  company?: CompanyForCalculation | null;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isSubmitting?: boolean;
  className?: string;
}

export interface InvoiceItemRowRef {
  focusDescription: () => void;
}

// 入力フィールドの順序
const fieldRefs = {
  description: 'description',
  quantity: 'quantity',
  unitPrice: 'unitPrice',
  discountAmount: 'discountAmount',
  taxCategory: 'taxCategory',
  taxRate: 'taxRate',
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

export const InvoiceItemRow = forwardRef<
  InvoiceItemRowRef,
  InvoiceItemRowProps
>(function InvoiceItemRow(
  {
    index,
    control,
    errors,
    setValue: _setValue,
    company,
    onRemove,
    isSubmitting = false,
    className,
  },
  ref
) {
  // 品目名Inputへのref
  const descriptionInputRef = useRef<HTMLInputElement>(null);

  // 外部からフォーカス可能にする
  useImperativeHandle(
    ref,
    () => ({
      focusDescription: () => {
        descriptionInputRef.current?.focus();
      },
    }),
    []
  );

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
  // 配列全体から該当インデックスの品目を取得（データ一貫性のため）
  const allItems = useWatch({ control, name: 'items' });
  const watchedItem = allItems?.[index];

  // 入力値（プリミティブ）に正規化
  const unitPrice = toNumber(watchedItem?.unitPrice);
  const quantity = toNumber(watchedItem?.quantity);
  const discountAmount = toNumber(watchedItem?.discountAmount);
  const taxCategory = watchedItem?.taxCategory || 'STANDARD';
  const taxRate = watchedItem?.taxRate as number | undefined;

  // フォームに書き戻さず、描画専用に算出
  const displayAmount = useMemo(() => {
    if (
      !company ||
      !Number.isFinite(unitPrice) ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      unitPrice < 0
    ) {
      return 0;
    }
    try {
      const result = calculateItemTax(
        { unitPrice, quantity, discountAmount, taxCategory, taxRate },
        company
      );
      return company.priceIncludesTax ? result.lineTotal : result.lineNet;
    } catch {
      return 0;
    }
  }, [unitPrice, quantity, discountAmount, taxCategory, taxRate, company]);

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
              ref={descriptionInputRef}
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

      {/* 税区分 */}
      <td className="px-3 py-2 border-b border-gray-200 w-36 min-w-[9rem]">
        <TaxCategorySelect<InvoiceFormWithPaymentData>
          control={control}
          name={`items.${index}.taxCategory`}
          errors={errors}
          standardTaxRate={company?.standardTaxRate}
          reducedTaxRate={company?.reducedTaxRate}
          disabled={isSubmitting}
          showDescription={false}
          className="w-full"
        />
      </td>

      {/* 個別税率 */}
      <td className="px-3 py-2 border-b border-gray-200 w-24 min-w-[6rem]">
        <TaxRateInput<InvoiceFormWithPaymentData>
          control={control}
          name={`items.${index}.taxRate`}
          errors={errors}
          taxCategory={taxCategory}
          standardTaxRate={company?.standardTaxRate}
          reducedTaxRate={company?.reducedTaxRate}
          disabled={isSubmitting}
          showDefaultRate={false}
          hideWhenDisabled={true}
          className="w-full"
        />
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

      {/* 小計/金額（読み取り専用・派生値） */}
      <td className="px-3 py-2 border-b border-gray-200 w-32">
        <div className="h-8 flex items-center justify-end text-sm font-mono font-semibold text-gray-900 bg-blue-50 rounded px-2 border border-blue-200">
          {formatCurrency(displayAmount)}
        </div>
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
});
