/**
 * リスト画面で使用する共通ソート・ステータスオプション定数
 */

// ソート共通オプション
export const COMMON_SORT_OPTIONS = [
  { value: 'createdAt_desc', label: '作成日（新しい順）' },
  { value: 'createdAt_asc', label: '作成日（古い順）' },
  { value: 'issueDate_desc', label: '発行日（新しい順）' },
  { value: 'issueDate_asc', label: '発行日（古い順）' },
] as const;

// 番号ソート
export const NUMBER_SORT_OPTIONS = [
  { value: 'number_desc', label: '番号（降順）' },
  { value: 'number_asc', label: '番号（昇順）' },
] as const;

// ドメイン別ソートオプション
export const QUOTE_SORT_OPTIONS = [
  ...COMMON_SORT_OPTIONS,
  { value: 'quoteNumber_desc', label: '見積書番号（降順）' },
  { value: 'quoteNumber_asc', label: '見積書番号（昇順）' },
] as const;

export const INVOICE_SORT_OPTIONS = [
  ...COMMON_SORT_OPTIONS,
  { value: 'dueDate_desc', label: '支払期限（新しい順）' },
  { value: 'dueDate_asc', label: '支払期限（古い順）' },
  { value: 'invoiceNumber_desc', label: '請求書番号（降順）' },
  { value: 'invoiceNumber_asc', label: '請求書番号（昇順）' },
] as const;

export const DOCUMENT_SORT_OPTIONS = [
  ...COMMON_SORT_OPTIONS,
  ...NUMBER_SORT_OPTIONS,
] as const;

export const CLIENT_SORT_OPTIONS = [
  { value: 'createdAt_desc', label: '登録日（新しい順）' },
  { value: 'createdAt_asc', label: '登録日（古い順）' },
  { value: 'name_asc', label: '名前（あ〜ん）' },
  { value: 'name_desc', label: '名前（ん〜あ）' },
] as const;

// ステータス共通オプション
export const COMMON_STATUS_OPTIONS = [
  { value: '', label: '全てのステータス' },
  { value: 'DRAFT', label: '下書き' },
  { value: 'SENT', label: '送信済み' },
] as const;

export const QUOTE_STATUS_OPTIONS = [
  ...COMMON_STATUS_OPTIONS,
  { value: 'ACCEPTED', label: '承認' },
  { value: 'DECLINED', label: '却下' },
] as const;

export const INVOICE_STATUS_OPTIONS = [
  ...COMMON_STATUS_OPTIONS,
  { value: 'PAID', label: '支払済み' },
  { value: 'OVERDUE', label: '期限超過' },
] as const;

export const DOCUMENT_STATUS_OPTIONS = [
  { value: '', label: '全てのステータス' },
  { value: 'DRAFT', label: '下書き' },
  { value: 'SENT', label: '送信済み' },
  { value: 'ACCEPTED', label: '承認済み（見積書）' },
  { value: 'DECLINED', label: '却下（見積書）' },
  { value: 'PAID', label: '支払済み（請求書）' },
  { value: 'OVERDUE', label: '期限超過（請求書）' },
] as const;

// 型定義
export type CommonSortOption = (typeof COMMON_SORT_OPTIONS)[number]['value'];
export type QuoteSortOption = (typeof QUOTE_SORT_OPTIONS)[number]['value'];
export type InvoiceSortOption = (typeof INVOICE_SORT_OPTIONS)[number]['value'];
export type DocumentSortOption =
  (typeof DOCUMENT_SORT_OPTIONS)[number]['value'];
export type ClientSortOption = (typeof CLIENT_SORT_OPTIONS)[number]['value'];

export type CommonStatusOption =
  (typeof COMMON_STATUS_OPTIONS)[number]['value'];
export type QuoteStatusOption = (typeof QUOTE_STATUS_OPTIONS)[number]['value'];
export type InvoiceStatusOption =
  (typeof INVOICE_STATUS_OPTIONS)[number]['value'];
export type DocumentStatusOption =
  (typeof DOCUMENT_STATUS_OPTIONS)[number]['value'];
