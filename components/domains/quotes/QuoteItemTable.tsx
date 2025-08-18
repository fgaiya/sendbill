'use client';

import { useMemo, useRef, useEffect } from 'react';

import { Plus, Upload, Download, Table2 } from 'lucide-react';
import { useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  calculateQuoteTotal,
  type CompanyForCalculation,
} from '@/lib/domains/quotes/calculations';
import type { QuoteFormWithItemsData } from '@/lib/domains/quotes/form-schemas';
import { formatCurrency } from '@/lib/shared/utils';
import { cn } from '@/lib/shared/utils/ui';

import { QuoteItemRow, QuoteItemRowRef } from './QuoteItemRow';

import type {
  UseFieldArrayReturn,
  Control,
  FieldErrors,
  UseFormSetValue,
} from 'react-hook-form';

export interface QuoteItemTableProps {
  control: Control<QuoteFormWithItemsData>;
  errors: FieldErrors<QuoteFormWithItemsData>;
  setValue: UseFormSetValue<QuoteFormWithItemsData>;
  fieldArray: UseFieldArrayReturn<QuoteFormWithItemsData, 'items', 'keyId'>;
  company?: CompanyForCalculation | null;
  isSubmitting?: boolean;
  className?: string;
}

export function QuoteItemTable({
  control,
  errors,
  setValue,
  fieldArray,
  company,
  isSubmitting = false,
  className,
}: QuoteItemTableProps) {
  const { fields, append, remove, move } = fieldArray;

  // 品目行refの管理
  const itemRowRefs = useRef<(QuoteItemRowRef | null)[]>([]);

  // fieldsの変更に合わせてrefs配列を調整
  useEffect(() => {
    itemRowRefs.current = itemRowRefs.current.slice(0, fields.length);
  }, [fields.length]);

  // 品目合計の計算
  const items = useWatch({
    control,
    name: 'items',
  });

  const totals = useMemo(() => {
    if (!company || !items) {
      return {
        subtotal: 0,
        totalTax: 0,
        totalAmount: 0,
        taxSummary: [],
        itemResults: [],
      };
    }

    const result = calculateQuoteTotal(items, company);

    return result;
  }, [items, company]);

  // 新しい品目を追加
  const handleAddItem = () => {
    const newItem = {
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxCategory: 'STANDARD' as const,
      taxRate: undefined,
      discountAmount: 0,
      unit: '',
      sku: '',
      sortOrder: fields.length,
      subtotal: 0,
    };

    append(newItem);

    // 追加後、新しい品目の最初のフィールド（品目名）にフォーカス
    setTimeout(() => {
      const newIndex = fields.length;
      itemRowRefs.current[newIndex]?.focusDescription();
    }, 50);
  };

  // 品目を削除
  const handleRemoveItem = (index: number) => {
    remove(index);
  };

  // 品目を上に移動
  const handleMoveUp = (index: number) => {
    if (index > 0) {
      move(index, index - 1);
    }
  };

  // 品目を下に移動
  const handleMoveDown = (index: number) => {
    if (index < fields.length - 1) {
      move(index, index + 1);
    }
  };

  // 一括操作のプレースホルダー（UX改善機能で実装）
  const handleImport = () => {
    // TODO: CSV/Excel インポート機能を実装
    console.log('品目一括インポート');
  };

  const handleExport = () => {
    // TODO: CSV/Excel エクスポート機能を実装
    console.log('品目一括エクスポート');
  };

  const isEmpty = fields.length === 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* ヘッダーとアクション */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Table2 className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">品目明細</h3>
          <span className="text-sm text-gray-500">({fields.length}件)</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleImport}
            disabled={isSubmitting}
            className="hidden sm:flex"
          >
            <Upload className="h-4 w-4 mr-2" />
            インポート
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isSubmitting || isEmpty}
            className="hidden sm:flex"
          >
            <Download className="h-4 w-4 mr-2" />
            エクスポート
          </Button>
        </div>
      </div>

      {/* テーブル */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        {isEmpty ? (
          // 空状態
          <div className="p-8 text-center">
            <Table2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              品目がありません
            </h4>
            <p className="text-gray-500 mb-4">
              見積書に含める品目を追加してください
            </p>
            <Button
              type="button"
              onClick={handleAddItem}
              disabled={isSubmitting}
            >
              <Plus className="h-4 w-4 mr-2" />
              最初の品目を追加
            </Button>
          </div>
        ) : (
          // テーブル表示
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                    品目名 <span className="text-red-500 ml-1">*</span>
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    数量 <span className="text-red-500 ml-1">*</span>
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    単価 <span className="text-red-500 ml-1">*</span>
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    割引額
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    税区分 <span className="text-red-500 ml-1">*</span>
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    個別税率
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    単位
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    SKU
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    {company?.priceIncludesTax
                      ? '金額（税込）'
                      : '小計（税抜）'}
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    削除
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fields.map((field, index) => (
                  <QuoteItemRow
                    key={field.keyId}
                    ref={(el) => {
                      itemRowRefs.current[index] = el;
                    }}
                    index={index}
                    control={control}
                    errors={errors}
                    setValue={setValue}
                    company={company}
                    onRemove={() => handleRemoveItem(index)}
                    onMoveUp={() => handleMoveUp(index)}
                    onMoveDown={() => handleMoveDown(index)}
                    isSubmitting={isSubmitting}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 品目追加ボタン */}
      <div className="flex justify-center py-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddItem}
          disabled={isSubmitting}
          className="flex items-center space-x-2 text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
        >
          <Plus className="h-4 w-4" />
          <span>品目を追加</span>
        </Button>
      </div>

      {/* 合計セクション */}
      {!isEmpty && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex justify-between items-center text-sm">
            <div className="space-y-1">
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">
                  品目数:{' '}
                  <span className="font-medium">{items?.length || 0}件</span>
                </span>
                <span className="text-gray-600">
                  小計合計:{' '}
                  <span className="font-medium">
                    {formatCurrency(totals.subtotal)}
                  </span>
                </span>
                <span className="text-gray-600">
                  消費税:{' '}
                  <span className="font-medium">
                    {formatCurrency(totals.totalTax)}
                  </span>
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900">
                総額: {formatCurrency(totals.totalAmount)}
              </div>
              <div className="text-xs text-gray-500">
                税率別内訳: {totals.taxSummary.length}種類
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
