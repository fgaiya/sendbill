import type { QuoteItemFormData } from './form-schemas';

/**
 * 品目レベルの計算結果型
 */
export interface ItemCalculationResult {
  subtotal: number;
  netAmount: number; // 割引後の金額
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

/**
 * 数値を通貨フォーマット（日本円）で表示
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);
}

/**
 * 数値を3桁区切りフォーマットで表示
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ja-JP').format(value);
}
