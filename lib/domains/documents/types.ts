/**
 * 帳票統合一覧のための型定義
 * 見積書と請求書を統合して管理するための共通型
 */

import type { Invoice } from '@/lib/domains/invoices/types';
import type { Quote } from '@/lib/domains/quotes/types';

// 税率定数（将来の税率変更に対応）
const TAX_RATES = {
  STANDARD: 10, // 標準税率 10%
  REDUCED: 8, // 軽減税率 8%
} as const;

/**
 * 帳票種別
 */
export type DocumentType = 'quote' | 'invoice';

/**
 * 統合帳票型（Quote | Invoice のユニオン型）
 */
export type Document =
  | (Quote & { documentType: 'quote' })
  | (Invoice & { documentType: 'invoice' });

/**
 * 統合帳票一覧のパラメータ型
 */
export interface DocumentListParams {
  page?: number;
  limit?: number;
  q?: string;
  type?: DocumentType | 'all';
  sort?: DocumentSortOption;
  status?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * 統合帳票一覧のレスポンス型
 */
export interface DocumentListResponse {
  data: Document[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: {
    quotesCount: number;
    invoicesCount: number;
    totalCount: number;
  };
}

/**
 * ソートオプション（統合）
 */
export type DocumentSortOption =
  | 'createdAt_desc'
  | 'createdAt_asc'
  | 'issueDate_desc'
  | 'issueDate_asc'
  | 'number_desc'
  | 'number_asc';

/**
 * 統合ステータス型
 * 見積書と請求書のステータスを統合
 */
export type DocumentStatus =
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED' // 見積書のみ
  | 'DECLINED' // 見積書のみ
  | 'PAID' // 請求書のみ
  | 'OVERDUE'; // 請求書のみ

/**
 * Document型ガード関数
 */
export function isQuote(
  document: Document
): document is Quote & { documentType: 'quote' } {
  return document.documentType === 'quote';
}

export function isInvoice(
  document: Document
): document is Invoice & { documentType: 'invoice' } {
  return document.documentType === 'invoice';
}

/**
 * 帳票番号取得ヘルパー
 */
export function getDocumentNumber(document: Document): string {
  if (isQuote(document)) {
    return document.quoteNumber || '(下書き)';
  }
  return document.invoiceNumber || '(下書き)';
}

/**
 * 帳票種別表示名取得
 */
export function getDocumentTypeName(type: DocumentType): string {
  return type === 'quote' ? '見積書' : '請求書';
}

/**
 * 帳票詳細URL取得
 */
export function getDocumentDetailUrl(document: Document): string {
  const type = document.documentType;
  return `/dashboard/documents/${type}s/${document.id}`;
}

/**
 * 帳票編集URL取得
 */
export function getDocumentEditUrl(document: Document): string {
  const type = document.documentType;
  return `/dashboard/${type}s/${document.id}/edit`;
}

/**
 * 統合計算結果型
 */
export interface DocumentTotal {
  subtotal: number;
  totalTax: number;
  totalAmount: number;
}

/**
 * 帳票合計金額計算（統合）
 */
export function calculateDocumentTotal(document: Document): DocumentTotal {
  if (!document.items || document.items.length === 0) {
    return { subtotal: 0, totalTax: 0, totalAmount: 0 };
  }

  let subtotal = 0;
  let totalTax = 0;

  for (const item of document.items) {
    // 税抜金額（割引後）
    const lineNet = item.unitPrice * item.quantity - (item.discountAmount || 0);
    let lineTax = 0;

    // 税額計算（品目の taxRate を優先、なければデフォルト税率）
    if (item.taxCategory === 'STANDARD') {
      const taxRate = item.taxRate ?? TAX_RATES.STANDARD;
      lineTax = Math.round((lineNet * taxRate) / 100);
    } else if (item.taxCategory === 'REDUCED') {
      const taxRate = item.taxRate ?? TAX_RATES.REDUCED;
      lineTax = Math.round((lineNet * taxRate) / 100);
    }
    // EXEMPT, NON_TAXは税額0

    subtotal += lineNet;
    totalTax += lineTax;
  }

  return {
    subtotal,
    totalTax,
    totalAmount: subtotal + totalTax,
  };
}
