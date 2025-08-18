import React from 'react';

import { Controller } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
import { FormFieldWrapper } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { CompanyFormData } from '@/lib/features/settings/company';

import type { Control, FieldErrors } from 'react-hook-form';

interface CompanyTaxSettingsFieldsProps {
  control: Control<CompanyFormData>;
  errors: FieldErrors<CompanyFormData>;
  isSubmitting: boolean;
}

export function CompanyTaxSettingsFields({
  control,
  errors,
  isSubmitting,
}: CompanyTaxSettingsFieldsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">税務設定</h3>

      {/* 標準税率 */}
      <Controller
        control={control}
        name="standardTaxRate"
        render={({ field }) => (
          <FormFieldWrapper
            label="標準税率"
            id="standardTaxRate"
            required
            error={errors.standardTaxRate?.message}
            description="軽減税率以外の商品に適用される標準的な消費税率を設定してください"
          >
            <div className="relative">
              <Input
                {...field}
                id="standardTaxRate"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                max="100"
                placeholder="10.00"
                disabled={isSubmitting}
                value={field.value?.toString() ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    field.onChange(10);
                  } else {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                      field.onChange(numValue);
                    }
                  }
                }}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                %
              </span>
            </div>
          </FormFieldWrapper>
        )}
      />

      {/* 軽減税率 */}
      <Controller
        control={control}
        name="reducedTaxRate"
        render={({ field }) => (
          <FormFieldWrapper
            label="軽減税率"
            id="reducedTaxRate"
            required
            error={errors.reducedTaxRate?.message}
            description="食品・新聞など軽減税率対象商品に適用される税率を設定してください"
          >
            <div className="relative">
              <Input
                {...field}
                id="reducedTaxRate"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                max="100"
                placeholder="8.00"
                disabled={isSubmitting}
                value={field.value?.toString() ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    field.onChange(8);
                  } else {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                      field.onChange(numValue);
                    }
                  }
                }}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                %
              </span>
            </div>
          </FormFieldWrapper>
        )}
      />

      {/* 税込価格設定 */}
      <Controller
        control={control}
        name="priceIncludesTax"
        render={({ field: { value, onChange, ...field } }) => (
          <FormFieldWrapper
            label="価格表示設定"
            id="priceIncludesTax"
            error={errors.priceIncludesTax?.message}
            description="見積書・請求書での価格の表示方法を選択してください"
          >
            <div className="flex items-center space-x-2">
              <Checkbox
                {...field}
                id="priceIncludesTax"
                checked={value}
                onCheckedChange={onChange}
                disabled={isSubmitting}
              />
              <label
                htmlFor="priceIncludesTax"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                税込価格で入力・表示する
              </label>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              {value ? (
                <span className="text-blue-600">
                  ✓ 単価は税込価格として入力され、税抜価格は自動計算されます
                </span>
              ) : (
                <span className="text-green-600">
                  ✓ 単価は税抜価格として入力され、税込価格は自動計算されます
                </span>
              )}
            </div>
          </FormFieldWrapper>
        )}
      />

      {/* 税率設定の説明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <h4 className="font-medium text-blue-900 mb-2">税率設定について</h4>
        <ul className="space-y-1 text-blue-800">
          <li>• 標準税率: 一般的な商品・サービスに適用される税率</li>
          <li>• 軽減税率: 食品・新聞などの対象商品に適用される税率</li>
          <li>• 品目ごとに個別の税率を設定することも可能です</li>
          <li>• 免税・非課税の品目は税率に関係なく税額0円になります</li>
        </ul>
      </div>
    </div>
  );
}
