import { Prisma, InvoiceStatus } from '@prisma/client';
import Papa from 'papaparse';

import type {
  InvoiceFilterConditions,
  InvoiceIncludeConfig,
  InvoiceIncludeOption,
  InvoiceSortOption,
  TaxCalculationResult,
  InvoiceItem,
  Company,
  StatusTransitionRule,
  OverdueCheckResult,
} from './types';

/**
 * 請求書ドメイン共通ユーティリティ
 */

// 検索対象フィールド
export const INVOICE_SEARCH_FIELDS = [
  'invoiceNumber',
  'notes',
  'client.name',
] as const;

// ソートマッピング
export const INVOICE_SORT_MAPPING: Record<
  InvoiceSortOption,
  Prisma.InvoiceOrderByWithRelationInput
> = {
  issueDate_asc: { issueDate: 'asc' },
  issueDate_desc: { issueDate: 'desc' },
  dueDate_asc: { dueDate: 'asc' },
  dueDate_desc: { dueDate: 'desc' },
  createdAt_asc: { createdAt: 'asc' },
  createdAt_desc: { createdAt: 'desc' },
  invoiceNumber_asc: { invoiceNumber: 'asc' },
  invoiceNumber_desc: { invoiceNumber: 'desc' },
};

// includeオプション
export const INVOICE_INCLUDE_OPTIONS = ['client', 'items', 'quote'] as const;

// ステータス遷移ルール
export const STATUS_TRANSITION_RULES: StatusTransitionRule[] = [
  {
    from: 'DRAFT',
    to: ['SENT'],
    requiresItems: true,
    requiresNumberGeneration: true,
  },
  {
    from: 'SENT',
    to: ['PAID', 'OVERDUE'],
    requiresItems: false,
    requiresNumberGeneration: false,
    requiresPaymentDate: false, // PAID遷移時のみ必要（別途チェック）
  },
  {
    from: 'OVERDUE',
    to: ['PAID'],
    requiresItems: false,
    requiresNumberGeneration: false,
    requiresPaymentDate: true,
  },
  {
    from: 'PAID',
    to: [], // 支払済みからの遷移は基本的になし
    requiresItems: false,
    requiresNumberGeneration: false,
  },
];

/**
 * 関連データ取得設定を構築
 */
export function buildIncludeRelations(
  include: InvoiceIncludeOption[]
): InvoiceIncludeConfig {
  const config: InvoiceIncludeConfig = {};

  if (include.includes('client')) {
    config.client = true;
  }

  if (include.includes('items')) {
    config.items = {
      orderBy: {
        sortOrder: 'asc',
      },
    };
  }

  if (include.includes('quote')) {
    config.quote = {
      select: {
        id: true,
        quoteNumber: true,
        issueDate: true,
        status: true,
      },
    };
  }

  return config;
}

/**
 * 請求書検索WHERE条件を構築
 */
export function buildInvoiceSearchWhere(
  companyId: string,
  options: {
    query?: string;
    status?: InvoiceStatus;
    clientId?: string;
    quoteId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    dueDateFrom?: Date;
    dueDateTo?: Date;
  } = {}
): InvoiceFilterConditions {
  const where: InvoiceFilterConditions = {
    companyId,
    deletedAt: null,
  };

  // ステータスフィルター
  if (options.status) {
    where.status = options.status;
  }

  // クライアントフィルター
  if (options.clientId) {
    where.clientId = options.clientId;
  }

  // 見積書フィルター
  if (options.quoteId) {
    where.quoteId = options.quoteId;
  }

  // 発行日範囲フィルター
  if (options.dateFrom || options.dateTo) {
    where.issueDate = {};
    if (options.dateFrom) {
      where.issueDate.gte = options.dateFrom;
    }
    if (options.dateTo) {
      where.issueDate.lte = options.dateTo;
    }
  }

  // 支払期限範囲フィルター
  if (options.dueDateFrom || options.dueDateTo) {
    where.dueDate = {};
    if (options.dueDateFrom) {
      where.dueDate.gte = options.dueDateFrom;
    }
    if (options.dueDateTo) {
      where.dueDate.lte = options.dueDateTo;
    }
  }

  // テキスト検索
  if (options.query) {
    where.OR = [
      {
        invoiceNumber: {
          contains: options.query,
          mode: 'insensitive',
        },
      },
      {
        notes: {
          contains: options.query,
          mode: 'insensitive',
        },
      },
      {
        client: {
          name: {
            contains: options.query,
            mode: 'insensitive',
          },
        },
      },
    ];
  }

  return where;
}

/**
 * ソート条件を構築
 */
export function buildOrderBy(
  sort: InvoiceSortOption
): Prisma.InvoiceOrderByWithRelationInput {
  return INVOICE_SORT_MAPPING[sort] ?? { createdAt: 'desc' };
}

/**
 * 請求書番号を生成
 */
export function generateInvoiceNumber(
  sequence: number,
  format = 'I{seq:04d}'
): string {
  return format.replace('{seq:04d}', sequence.toString().padStart(4, '0'));
}

/**
 * ステータス遷移が有効かチェック
 */
export function isValidStatusTransition(
  from: InvoiceStatus,
  to: InvoiceStatus
): boolean {
  const rule = STATUS_TRANSITION_RULES.find((r) => r.from === from);
  return rule ? rule.to.includes(to) : false;
}

/**
 * ステータス遷移に品目が必要かチェック
 */
export function requiresItemsForTransition(
  from: InvoiceStatus,
  to: InvoiceStatus
): boolean {
  const rule = STATUS_TRANSITION_RULES.find(
    (r) => r.from === from && r.to.includes(to)
  );
  return rule ? (rule.requiresItems ?? false) : false;
}

/**
 * ステータス遷移に番号生成が必要かチェック
 */
export function requiresNumberGenerationForTransition(
  from: InvoiceStatus,
  to: InvoiceStatus
): boolean {
  const rule = STATUS_TRANSITION_RULES.find(
    (r) => r.from === from && r.to.includes(to)
  );
  return rule ? (rule.requiresNumberGeneration ?? false) : false;
}

/**
 * ステータス遷移に支払日が必要かチェック
 */
export function requiresPaymentDateForTransition(
  from: InvoiceStatus,
  to: InvoiceStatus
): boolean {
  const rule = STATUS_TRANSITION_RULES.find(
    (r) => r.from === from && r.to.includes(to)
  );
  return rule ? (rule.requiresPaymentDate ?? false) : false;
}

/**
 * 支払期限オーバーの自動ステータス更新が必要かチェック
 */
export function shouldAutoUpdateOverdueStatus(
  invoiceStatus: InvoiceStatus,
  dueDate: Date | null,
  paymentDate: Date | null
): OverdueCheckResult {
  if (!dueDate || invoiceStatus === 'PAID' || paymentDate) {
    return {
      isOverdue: false,
      daysOverdue: 0,
      shouldUpdateStatus: false,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // 時刻を0時に設定
  const dueDateOnly = new Date(dueDate);
  dueDateOnly.setHours(0, 0, 0, 0);

  const daysOverdue = Math.floor(
    (today.getTime() - dueDateOnly.getTime()) / (1000 * 60 * 60 * 24)
  );

  const isOverdue = daysOverdue > 0;
  const shouldUpdateStatus = isOverdue && invoiceStatus === 'SENT';

  return {
    isOverdue,
    daysOverdue: Math.max(0, daysOverdue),
    shouldUpdateStatus,
  };
}

/**
 * 支払期限を自動計算（発行日から指定日数後）
 */
export function calculateDueDate(
  issueDate: Date,
  paymentTermDays: number = 30
): Date {
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + paymentTermDays);
  return dueDate;
}

/**
 * 税計算を実行（見積書と同じロジックを再利用）
 */
export function calculateTax(
  items: InvoiceItem[],
  company: Pick<
    Company,
    'standardTaxRate' | 'reducedTaxRate' | 'priceIncludesTax'
  >
): TaxCalculationResult {
  let subtotalAmount = 0;
  let taxAmountStandard = 0;
  let taxAmountReduced = 0;
  let taxAmountExempt = 0;

  items.forEach((item) => {
    // 品目小計（割引後）
    const lineNet = item.unitPrice * item.quantity - item.discountAmount;
    subtotalAmount += lineNet;

    // 税率決定
    let effectiveTaxRate = 0;
    if (item.taxRate !== null) {
      // 個別税率が指定されている場合
      effectiveTaxRate = item.taxRate;
    } else {
      // 税区分に基づく税率
      switch (item.taxCategory) {
        case 'STANDARD':
          effectiveTaxRate = company.standardTaxRate;
          break;
        case 'REDUCED':
          effectiveTaxRate = company.reducedTaxRate;
          break;
        case 'EXEMPT':
        case 'NON_TAX':
          effectiveTaxRate = 0;
          break;
      }
    }

    // 税額計算（四捨五入）
    const lineTax = Math.round((lineNet * effectiveTaxRate) / 100);

    // 税率別に集計
    if (
      item.taxCategory === 'STANDARD' ||
      (item.taxRate !== null && item.taxRate === company.standardTaxRate)
    ) {
      taxAmountStandard += lineTax;
    } else if (
      item.taxCategory === 'REDUCED' ||
      (item.taxRate !== null && item.taxRate === company.reducedTaxRate)
    ) {
      taxAmountReduced += lineTax;
    } else if (
      item.taxCategory === 'EXEMPT' ||
      item.taxCategory === 'NON_TAX'
    ) {
      taxAmountExempt += lineTax;
    } else {
      // その他の個別税率は標準税額に分類
      taxAmountStandard += lineTax;
    }
  });

  const totalAmount =
    subtotalAmount + taxAmountStandard + taxAmountReduced + taxAmountExempt;

  return {
    subtotalAmount,
    taxAmountStandard,
    taxAmountReduced,
    taxAmountExempt,
    totalAmount,
  };
}

/**
 * 税込価格から税抜価格を逆算
 */
export function calculateExclusivePrice(
  inclusivePrice: number,
  taxRate: number
): number {
  return Math.round((inclusivePrice * 100) / (100 + taxRate));
}

/**
 * 並び順正規化（0から連番）
 */
export function normalizeSortOrder(
  items: Array<{ id: string; sortOrder: number }>
): Array<{ id: string; sortOrder: number }> {
  return items
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, index) => ({
      ...item,
      sortOrder: index,
    }));
}

/**
 * CSVデータのパース・バリデーション
 */
export function parseCSVData(csvContent: string): {
  data: unknown[];
  errors: Array<{ row: number; error: string }>;
} {
  const results = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  return {
    data: results.data,
    errors: results.errors.map((error) => ({
      row: error.row ?? 0,
      error: error.message,
    })),
  };
}

/**
 * フォームエラーメッセージ生成（請求書用）
 */
export function generateInvoiceFormErrorMessage(
  fieldName: string,
  errorType: string
): string {
  const messages: Record<string, Record<string, string>> = {
    clientId: {
      required: 'クライアントを選択してください',
      invalid: '有効なクライアントを選択してください',
    },
    issueDate: {
      required: '発行日を入力してください',
      invalid: '有効な発行日を入力してください',
    },
    dueDate: {
      invalid: '有効な支払期限を入力してください',
      beforeIssue: '支払期限は発行日以降である必要があります',
    },
    paymentDate: {
      invalid: '有効な支払日を入力してください',
      required: '支払済みステータスには支払日が必要です',
    },
  };

  return messages[fieldName]?.[errorType] ?? 'エラーが発生しました';
}

/**
 * 請求書品目フォームエラーメッセージ生成
 */
export function generateInvoiceItemFormErrorMessage(
  fieldName: string,
  errorType: string
): string {
  const messages: Record<string, Record<string, string>> = {
    description: {
      required: '品目名を入力してください',
      minLength: '品目名は1文字以上である必要があります',
    },
    quantity: {
      required: '数量を入力してください',
      positive: '数量は正の数である必要があります',
      invalid: '有効な数量を入力してください',
    },
    unitPrice: {
      required: '単価を入力してください',
      nonnegative: '単価は0以上である必要があります',
      invalid: '有効な単価を入力してください',
    },
    discountAmount: {
      nonnegative: '割引額は0以上である必要があります',
      exceedsTotal: '割引額は品目合計金額を超えることはできません',
      invalid: '有効な割引額を入力してください',
    },
    taxRate: {
      min: '税率は0以上である必要があります',
      max: '税率は100以下である必要があります',
      invalid: '有効な税率を入力してください',
    },
  };

  return messages[fieldName]?.[errorType] ?? 'エラーが発生しました';
}

/**
 * 汎用エラーメッセージ生成
 */
export function generateErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '不明なエラーが発生しました';
}

/**
 * フォームデータ前処理（請求書用）
 */
export function preprocessInvoiceFormData(
  data: Record<string, unknown>
): Record<string, unknown> {
  const processed = { ...data };

  // 空文字列をnullに変換
  Object.keys(processed).forEach((key) => {
    if (processed[key] === '') {
      processed[key] = null;
    }
  });

  // 日付フィールドの処理
  if (processed.issueDate && typeof processed.issueDate === 'string') {
    const date = new Date(processed.issueDate);
    if (isNaN(date.getTime())) {
      throw new Error('無効な発行日が指定されました');
    }
    processed.issueDate = date;
  }
  if (processed.dueDate && typeof processed.dueDate === 'string') {
    const date = new Date(processed.dueDate);
    if (isNaN(date.getTime())) {
      throw new Error('無効な支払期限が指定されました');
    }
    processed.dueDate = date;
  }
  if (processed.paymentDate && typeof processed.paymentDate === 'string') {
    const date = new Date(processed.paymentDate);
    if (isNaN(date.getTime())) {
      throw new Error('無効な支払日が指定されました');
    }
    processed.paymentDate = date;
  }

  return processed;
}
