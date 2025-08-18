/**
 * 税務関連の定数定義
 *
 * 税区分、税率、フォーマット関連の定数を一元管理
 */

import type { TaxCategory } from '@/lib/domains/quotes/calculations';

/**
 * 税区分オプション定義
 */
export interface TaxCategoryOption {
  value: TaxCategory;
  label: string;
  description: string;
  emoji: string;
}

export const TAX_CATEGORY_OPTIONS: TaxCategoryOption[] = [
  {
    value: 'STANDARD',
    label: '標準税率',
    description: '一般的な商品・サービス',
    emoji: '📊',
  },
  {
    value: 'REDUCED',
    label: '軽減税率',
    description: '食品・新聞など',
    emoji: '🥬',
  },
  {
    value: 'EXEMPT',
    label: '免税',
    description: '輸出品・国際輸送など',
    emoji: '🌍',
  },
  {
    value: 'NON_TAX',
    label: '非課税',
    description: '医療・福祉・教育など',
    emoji: '🏥',
  },
] as const;

/**
 * 税区分ラベルの取得
 */
export function getTaxCategoryLabel(category: TaxCategory): string {
  const option = TAX_CATEGORY_OPTIONS.find((opt) => opt.value === category);
  return option?.label ?? category;
}

/**
 * 税区分説明の取得
 */
export function getTaxCategoryDescription(category: TaxCategory): string {
  const option = TAX_CATEGORY_OPTIONS.find((opt) => opt.value === category);
  return option?.description ?? '';
}

/**
 * 税率範囲定数
 */
export const TAX_RATE_CONSTRAINTS = {
  MIN: 0,
  MAX: 100,
  STEP: 0.01,
  DEFAULT_STANDARD: 10,
  DEFAULT_REDUCED: 8,
} as const;

/**
 * 税率表示フォーマット
 */
export function formatTaxRate(rate: number): string {
  return `${rate.toFixed(2)}%`;
}

/**
 * 税区分によるデフォルト税率取得
 */
export function getDefaultTaxRate(
  category: TaxCategory,
  standardRate: number,
  reducedRate: number
): number {
  switch (category) {
    case 'STANDARD':
      return standardRate;
    case 'REDUCED':
      return reducedRate;
    case 'EXEMPT':
    case 'NON_TAX':
      return 0;
    default:
      return standardRate;
  }
}

/**
 * 税率入力が有効かどうかの判定
 */
export function isTaxRateInputEnabled(category: TaxCategory): boolean {
  return category === 'STANDARD' || category === 'REDUCED';
}

/**
 * 税区分バリデーション
 */
export function isValidTaxCategory(value: string): value is TaxCategory {
  return TAX_CATEGORY_OPTIONS.some((opt) => opt.value === value);
}
