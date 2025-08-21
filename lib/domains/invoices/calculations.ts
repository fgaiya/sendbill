/**
 * 請求書品目の計算機能
 * 見積書と同じ計算ロジックを使用
 */

import type { InvoiceItem } from './types';

/**
 * 請求書品目の合計金額計算結果型
 */
export interface InvoiceTotalCalculationResult {
  subtotal: number; // 小計（税抜合計）
  totalTax: number; // 消費税合計
  totalAmount: number; // 合計金額（税込）
  taxByRate: {
    standard: { taxableAmount: number; taxAmount: number };
    reduced: { taxableAmount: number; taxAmount: number };
    exempt: { taxableAmount: number; taxAmount: number };
  };
}

/**
 * 請求書品目リストから合計金額を計算
 */
export function calculateItemsTotal(
  items: InvoiceItem[]
): InvoiceTotalCalculationResult {
  if (!items || items.length === 0) {
    return {
      subtotal: 0,
      totalTax: 0,
      totalAmount: 0,
      taxByRate: {
        standard: { taxableAmount: 0, taxAmount: 0 },
        reduced: { taxableAmount: 0, taxAmount: 0 },
        exempt: { taxableAmount: 0, taxAmount: 0 },
      },
    };
  }

  let subtotal = 0;
  let totalTax = 0;
  const taxByRate = {
    standard: { taxableAmount: 0, taxAmount: 0 },
    reduced: { taxableAmount: 0, taxAmount: 0 },
    exempt: { taxableAmount: 0, taxAmount: 0 },
  };

  for (const item of items) {
    // 税抜金額（割引後）
    const lineNet = item.unitPrice * item.quantity - item.discountAmount;

    // 税額計算
    let lineTax = 0;
    let category: keyof typeof taxByRate = 'exempt';

    if (item.taxCategory === 'STANDARD') {
      const taxRate = item.taxRate ?? 10; // デフォルト10%
      lineTax = Math.round((lineNet * taxRate) / 100);
      category = 'standard';
    } else if (item.taxCategory === 'REDUCED') {
      const taxRate = item.taxRate ?? 8; // デフォルト8%
      lineTax = Math.round((lineNet * taxRate) / 100);
      category = 'reduced';
    }
    // EXEMPT, NON_TAXは税額0

    subtotal += lineNet;
    totalTax += lineTax;

    // 税率別集計
    taxByRate[category].taxableAmount += lineNet;
    taxByRate[category].taxAmount += lineTax;
  }

  return {
    subtotal,
    totalTax,
    totalAmount: subtotal + totalTax,
    taxByRate,
  };
}

/**
 * 単一品目の税計算
 */
export function calculateItemTax(
  item: Pick<
    InvoiceItem,
    'unitPrice' | 'quantity' | 'discountAmount' | 'taxCategory' | 'taxRate'
  >
) {
  const lineNet = item.unitPrice * item.quantity - item.discountAmount;

  let lineTax = 0;
  if (item.taxCategory === 'STANDARD') {
    const taxRate = item.taxRate ?? 10;
    lineTax = Math.round((lineNet * taxRate) / 100);
  } else if (item.taxCategory === 'REDUCED') {
    const taxRate = item.taxRate ?? 8;
    lineTax = Math.round((lineNet * taxRate) / 100);
  }

  return {
    lineNet,
    lineTax,
    lineTotal: lineNet + lineTax,
  };
}
