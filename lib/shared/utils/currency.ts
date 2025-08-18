/**
 * 通貨関連のユーティリティ関数
 * formatCurrency関数などを集約し、全画面/フォームで統一表現を提供
 */

/**
 * 数値を通貨フォーマット（日本円）で表示
 * 半角円記号を使用するように統一
 */
export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);

  // 全角円記号を半角に変換（統一ポリシー）
  return formatted.replace('￥', '¥');
}

/**
 * 数値を3桁区切りフォーマットで表示
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ja-JP').format(value);
}

/**
 * 税率をパーセント表示
 */
export function formatTaxRate(rate: number): string {
  return `${rate}%`;
}

/**
 * 税区分をSummaryCategory（英語）に変換
 * calculateQuoteTotal と UI で共有
 */
export function toSummaryCategory(
  taxCategory: 'STANDARD' | 'REDUCED' | 'EXEMPT' | 'NON_TAX'
): 'standard' | 'reduced' | 'exempt' | 'non_tax' {
  const categoryMap = {
    STANDARD: 'standard' as const,
    REDUCED: 'reduced' as const,
    EXEMPT: 'exempt' as const,
    NON_TAX: 'non_tax' as const,
  };

  return categoryMap[taxCategory];
}

/**
 * Summary Category（英語）を日本語表示名に変換
 */
export function getSummaryCategoryLabel(
  category: 'standard' | 'reduced' | 'exempt' | 'non_tax'
): string {
  const labelMap = {
    standard: '標準',
    reduced: '軽減',
    exempt: '免税',
    non_tax: '非課税',
  };

  return labelMap[category];
}
