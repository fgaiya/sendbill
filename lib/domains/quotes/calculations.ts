import Decimal from 'decimal.js';

import { formatCurrency, toSummaryCategory } from '@/lib/shared/utils';

import type { QuoteItemFormData } from './form-schemas';

// Re-export for external use (e.g., tests)
export type { QuoteItemFormData };

/**
 * 会社設定型（計算に必要な部分のみ）
 */
export interface CompanyForCalculation {
  standardTaxRate: number;
  reducedTaxRate: number;
  priceIncludesTax: boolean;
}

/**
 * 会社設定のデフォルト値
 */
export const DEFAULT_COMPANY: CompanyForCalculation = {
  standardTaxRate: 10,
  reducedTaxRate: 8,
  priceIncludesTax: false,
};

/**
 * 税区分定義
 */
export type TaxCategory = 'STANDARD' | 'REDUCED' | 'EXEMPT' | 'NON_TAX';

/**
 * 品目レベルの税計算結果型
 */
export interface TaxCalculationResult {
  lineNet: number; // 税抜金額（割引後）
  lineTax: number; // 税額
  lineTotal: number; // 税込金額
  effectiveTaxRate: number; // 実効税率
  taxCategory: TaxCategory; // 適用税区分
}

/**
 * 税率別集計結果型
 */
export interface TaxSummaryByRate {
  taxRate: number;
  taxableAmount: number; // 課税対象額
  taxAmount: number; // 税額
  category: 'standard' | 'reduced' | 'exempt' | 'non_tax';
}

/**
 * 見積書全体の計算結果型
 */
export interface QuoteTotalCalculationResult {
  subtotal: number; // 小計（税抜合計）
  totalTax: number; // 消費税合計
  totalAmount: number; // 総額
  taxSummary: TaxSummaryByRate[]; // 税率別内訳
  itemResults: TaxCalculationResult[]; // 各品目の計算結果
}

/**
 * 品目レベルの計算結果型（既存互換性のため）
 */
export interface ItemCalculationResult {
  subtotal: number;
  netAmount: number; // 割引後の金額
}

/**
 * 実効税率を決定する
 * PER_LINE計算方式: 品目の税区分・個別税率・会社設定に基づいて実際の税率を決定
 */
function determineEffectiveTaxRate(
  item: Partial<QuoteItemFormData>,
  company: CompanyForCalculation
): { rate: number; category: TaxCategory } {
  const taxCategory = (item.taxCategory as TaxCategory) || 'STANDARD';

  // EXEMPT/NON_TAXは個別税率に関係なく無条件で税率0
  if (taxCategory === 'EXEMPT' || taxCategory === 'NON_TAX') {
    return {
      rate: 0,
      category: taxCategory,
    };
  }

  // 個別税率が設定されている場合はそれを使用（課税区分のみ）
  if (item.taxRate !== undefined && item.taxRate !== null) {
    return {
      rate: Number(item.taxRate),
      category: taxCategory,
    };
  }

  // 税区分に基づいて既定税率を決定
  switch (taxCategory) {
    case 'STANDARD':
      return {
        rate: company.standardTaxRate,
        category: 'STANDARD',
      };
    case 'REDUCED':
      return {
        rate: company.reducedTaxRate,
        category: 'REDUCED',
      };
    default:
      return {
        rate: company.standardTaxRate,
        category: 'STANDARD',
      };
  }
}

/**
 * 品目レベルの税計算（PER_LINE方式）
 * 計画書に従い、行単位での四捨五入を実装
 */
export function calculateItemTax(
  item: Partial<QuoteItemFormData>,
  company: CompanyForCalculation
): TaxCalculationResult {
  const unitPrice = item.unitPrice ?? 0;
  const quantity = item.quantity ?? 0;
  const discountAmount = item.discountAmount ?? 0;

  // 入力値検証
  if (unitPrice < 0 || quantity <= 0) {
    return {
      lineNet: 0,
      lineTax: 0,
      lineTotal: 0,
      effectiveTaxRate: 0,
      taxCategory: 'STANDARD',
    };
  }

  const { rate: effectiveTaxRate, category: taxCategory } =
    determineEffectiveTaxRate(item, company);

  let lineNet: number;
  let lineTax: number;
  let lineTotal: number;

  if (company.priceIncludesTax) {
    // 税込価格設定の場合：税込金額（割引後）から行単位で税抜額を逆算
    const lineGross = Math.max(0, unitPrice * quantity - discountAmount);

    if (effectiveTaxRate === 0) {
      // 税率0の場合は逆算不要
      lineNet = lineGross;
      lineTax = 0;
      lineTotal = lineGross;
    } else {
      // 行単位で税抜額を逆算（PER_LINE四捨五入）
      const lineGrossDecimal = new Decimal(lineGross);
      const divisor = new Decimal(1).plus(
        new Decimal(effectiveTaxRate).div(100)
      );
      lineNet = lineGrossDecimal
        .div(divisor)
        .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
        .toNumber();
      lineTax = lineGross - lineNet;
      lineTotal = lineGross;
    }
  } else {
    // 税抜価格設定の場合：通常計算
    const subtotal = unitPrice * quantity;
    lineNet = Math.max(0, subtotal - discountAmount);

    // PER_LINE方式: 行単位で税額計算・四捨五入
    const lineNetDecimal = new Decimal(lineNet);
    const taxRateDecimal = new Decimal(effectiveTaxRate);
    lineTax = lineNetDecimal
      .mul(taxRateDecimal.div(100))
      .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
      .toNumber();
    lineTotal = lineNet + lineTax;
  }

  return {
    lineNet,
    lineTax,
    lineTotal,
    effectiveTaxRate,
    taxCategory,
  };
}

/**
 * 品目の小計を計算（割引考慮）
 * Issue #60 scope: 品目レベルの計算のみ、税計算は除外
 */
export function calculateItemSubtotal(
  unitPrice: number,
  quantity: number,
  discountAmount = 0
): ItemCalculationResult {
  // 入力値の検証
  if (unitPrice < 0) {
    throw new Error('単価は0以上である必要があります');
  }
  if (quantity <= 0) {
    throw new Error('数量は正の数である必要があります');
  }
  if (discountAmount < 0) {
    throw new Error('割引額は0以上である必要があります');
  }

  const subtotal = unitPrice * quantity;

  // 割引額が小計を超えないかチェック
  if (discountAmount > subtotal) {
    throw new Error('割引額は品目合計金額を超えることはできません');
  }

  const netAmount = subtotal - discountAmount;

  return {
    subtotal,
    netAmount,
  };
}

/**
 * フォームデータから小計を計算
 */
export function calculateItemFromForm(
  item: Partial<QuoteItemFormData>
): ItemCalculationResult {
  const unitPrice = item.unitPrice ?? 0;
  const quantity = item.quantity ?? 0;
  const discountAmount = item.discountAmount ?? 0;

  // 未入力や不正値（NaN, Infinity, 0数量）の場合は0を返す
  if (
    !Number.isFinite(unitPrice) ||
    !Number.isFinite(quantity) ||
    unitPrice < 0 ||
    quantity <= 0
  ) {
    return {
      subtotal: 0,
      netAmount: 0,
    };
  }

  return calculateItemSubtotal(unitPrice, quantity, discountAmount);
}

/**
 * 複数品目の合計を計算
 */
export function calculateItemsTotal(items: QuoteItemFormData[]): {
  totalSubtotal: number;
  totalNetAmount: number;
  itemCount: number;
} {
  let totalSubtotal = 0;
  let totalNetAmount = 0;

  for (const item of items) {
    try {
      const result = calculateItemFromForm(item);
      totalSubtotal += result.subtotal;
      totalNetAmount += result.netAmount;
    } catch {
      // 計算エラーの場合は無視（個別品目のバリデーションで対応）
      continue;
    }
  }

  return {
    totalSubtotal,
    totalNetAmount,
    itemCount: items.length,
  };
}

/**
 * リアルタイム計算用のデバウンス処理
 * パフォーマンス最適化のために使用
 */
export function debounce<A extends unknown[]>(
  func: (...args: A) => void,
  delay: number
): (...args: A) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return (...args: A) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// formatCurrency, formatNumber は lib/shared/utils/currency.ts に移動

/**
 * 見積書全体の税計算（PER_LINE方式・税率別集計）
 * 各品目を個別計算後、税率ごとに集計して合計を算出
 */
export function calculateQuoteTotal(
  items: QuoteItemFormData[],
  company: CompanyForCalculation
): QuoteTotalCalculationResult {
  // 各品目の計算結果
  const itemResults = items.map((item) => calculateItemTax(item, company));

  // 税率別集計用のマップ（免税/非課税を区別するためにcategory:taxRateをキーとする）
  const taxSummaryMap = new Map<
    string,
    {
      taxRate: number;
      taxableAmount: number;
      taxAmount: number;
      category: 'standard' | 'reduced' | 'exempt' | 'non_tax';
    }
  >();

  let totalSubtotal = 0;
  let totalTax = 0;

  // 各品目の結果を税率別に集計
  for (const result of itemResults) {
    totalSubtotal += result.lineNet;
    totalTax += result.lineTax;

    const taxRate = result.effectiveTaxRate;
    const category: 'standard' | 'reduced' | 'exempt' | 'non_tax' =
      toSummaryCategory(result.taxCategory);

    // 免税/非課税を区別するためのキー設計
    const key = `${category}:${taxRate}`;

    if (taxSummaryMap.has(key)) {
      const existing = taxSummaryMap.get(key)!;
      existing.taxableAmount += result.lineNet;
      existing.taxAmount += result.lineTax;
    } else {
      taxSummaryMap.set(key, {
        taxRate,
        taxableAmount: result.lineNet,
        taxAmount: result.lineTax,
        category,
      });
    }
  }

  // 税率別集計を配列に変換（税率順でソート）
  const taxSummary: TaxSummaryByRate[] = Array.from(
    taxSummaryMap.values()
  ).sort((a, b) => {
    // 税率降順、同率ならカテゴリ順（standard > reduced > exempt > non_tax）
    if (a.taxRate !== b.taxRate) {
      return b.taxRate - a.taxRate;
    }
    const categoryOrder = { standard: 0, reduced: 1, exempt: 2, non_tax: 3 };
    return categoryOrder[a.category] - categoryOrder[b.category];
  });

  const totalAmount = totalSubtotal + totalTax;

  return {
    subtotal: totalSubtotal,
    totalTax,
    totalAmount,
    taxSummary,
    itemResults,
  };
}

/**
 * 税率別集計を見やすい形式でフォーマット
 */
export function formatTaxSummary(taxSummary: TaxSummaryByRate[]): string {
  if (taxSummary.length === 0) {
    return '税額計算なし';
  }

  return taxSummary
    .map((summary) => {
      const rateLabel =
        summary.taxRate === 0
          ? summary.category === 'exempt'
            ? '免税'
            : '非課税'
          : `${summary.taxRate}%`;

      return `${rateLabel}: ${formatCurrency(summary.taxableAmount)} (税額: ${formatCurrency(summary.taxAmount)})`;
    })
    .join(', ');
}
