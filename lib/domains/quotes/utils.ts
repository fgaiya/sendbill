import { Prisma, QuoteStatus } from '@prisma/client';
import Papa from 'papaparse';

import type {
  QuoteFilterConditions,
  QuoteIncludeConfig,
  QuoteIncludeOption,
  QuoteSortOption,
  TaxCalculationResult,
  QuoteItem,
  Company,
  StatusTransitionRule,
} from './types';

/**
 * 見積書ドメイン共通ユーティリティ
 */

// 検索対象フィールド
export const QUOTE_SEARCH_FIELDS = [
  'quoteNumber',
  'notes',
  'client.name',
] as const;

// ソートマッピング
export const QUOTE_SORT_MAPPING: Record<
  QuoteSortOption,
  Prisma.QuoteOrderByWithRelationInput
> = {
  issueDate_asc: { issueDate: 'asc' },
  issueDate_desc: { issueDate: 'desc' },
  createdAt_asc: { createdAt: 'asc' },
  createdAt_desc: { createdAt: 'desc' },
  quoteNumber_asc: { quoteNumber: 'asc' },
  quoteNumber_desc: { quoteNumber: 'desc' },
};

// includeオプション
export const QUOTE_INCLUDE_OPTIONS = ['client', 'items'] as const;

// スキーマは lib/domains/quotes/schemas.ts に集約

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
    to: ['ACCEPTED', 'DECLINED'],
    requiresItems: false,
    requiresNumberGeneration: false,
  },
  {
    from: 'ACCEPTED',
    to: ['DECLINED'], // 受諾後でも辞退可能
    requiresItems: false,
    requiresNumberGeneration: false,
  },
  {
    from: 'DECLINED',
    to: ['SENT'], // 辞退後の再送信
    requiresItems: false,
    requiresNumberGeneration: false,
  },
];

/**
 * 関連データ取得設定を構築
 */
export function buildIncludeRelations(
  include: QuoteIncludeOption[]
): QuoteIncludeConfig {
  const config: QuoteIncludeConfig = {};

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

  return config;
}

/**
 * 見積書検索WHERE条件を構築
 */
export function buildQuoteSearchWhere(
  companyId: string,
  options: {
    query?: string;
    status?: QuoteStatus;
    clientId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  } = {}
): QuoteFilterConditions {
  const where: QuoteFilterConditions = {
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

  // 日付範囲フィルター
  if (options.dateFrom || options.dateTo) {
    where.issueDate = {};
    if (options.dateFrom) {
      where.issueDate.gte = options.dateFrom;
    }
    if (options.dateTo) {
      where.issueDate.lte = options.dateTo;
    }
  }

  // テキスト検索
  if (options.query) {
    where.OR = [
      {
        quoteNumber: {
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
          is: {
            name: {
              contains: options.query,
              mode: 'insensitive',
            },
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
  sort: QuoteSortOption
): Prisma.QuoteOrderByWithRelationInput {
  return QUOTE_SORT_MAPPING[sort] ?? { createdAt: 'desc' };
}

/**
 * 見積書番号を生成
 */
export function generateQuoteNumber(
  sequence: number,
  format = 'Q{seq:04d}'
): string {
  return format.replace('{seq:04d}', sequence.toString().padStart(4, '0'));
}

/**
 * ステータス遷移が有効かチェック
 */
export function isValidStatusTransition(
  from: QuoteStatus,
  to: QuoteStatus
): boolean {
  const rule = STATUS_TRANSITION_RULES.find((r) => r.from === from);
  return rule ? rule.to.includes(to) : false;
}

/**
 * ステータス遷移に品目が必要かチェック
 */
export function requiresItemsForTransition(
  from: QuoteStatus,
  to: QuoteStatus
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
  from: QuoteStatus,
  to: QuoteStatus
): boolean {
  const rule = STATUS_TRANSITION_RULES.find(
    (r) => r.from === from && r.to.includes(to)
  );
  return rule ? (rule.requiresNumberGeneration ?? false) : false;
}

/**
 * 税計算を実行
 */
export function calculateTax(
  items: Array<
    Pick<
      QuoteItem,
      'quantity' | 'unitPrice' | 'discountAmount' | 'taxRate' | 'taxCategory'
    >
  >,
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
  return Math.round(inclusivePrice / (1 + taxRate / 100));
}

/**
 * フォームデータの前処理（空文字をundefinedに変換）
 */
export function preprocessQuoteFormData(
  data: Record<string, unknown>
): Record<string, unknown> {
  const processed = { ...data };

  Object.keys(processed).forEach((key) => {
    if (processed[key] === '') {
      processed[key] = undefined;
    }
  });

  return processed;
}

/**
 * 品目の並び順を正規化
 */
export function normalizeSortOrder<T extends { sortOrder: number }>(
  items: T[]
): T[] {
  return items
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, index) => ({
      ...item,
      sortOrder: (index + 1) * 10,
    }));
}

/**
 * CSVデータをパース（Papa Parse使用）
 * クォート内カンマ、エスケープクォート、改行などCSV仕様に準拠
 * ヘッダー＆値の前後空白は明示的に trim
 */
export function parseCSVData(csvText: string): Array<Record<string, string>> {
  const trimmedText = csvText.trim();
  if (!trimmedText) {
    throw new Error('CSVファイルが空です');
  }

  // 型引数 <Record<string, string>> を渡すのがポイント
  const { data, errors } = Papa.parse<Record<string, string>>(trimmedText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    transform: (v) => (typeof v === 'string' ? v.trim() : v),
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((e) => {
        const rowNum = e.row !== undefined ? e.row + 1 : '不明';
        return `行 ${rowNum}: ${e.message}`;
      })
      .join(', ');
    throw new Error(`CSV解析エラー: ${errorMessages}`);
  }

  if (data.length === 0) {
    throw new Error('CSVファイルにデータ行がありません');
  }

  return data;
}

/**
 * 共通エラーメッセージ生成関数
 */
function generateErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
}

/**
 * エラーメッセージを生成
 */
export function generateQuoteFormErrorMessage(error: unknown): string {
  return generateErrorMessage(error, '見積書の処理中にエラーが発生しました');
}

/**
 * 品目エラーメッセージを生成
 */
export function generateQuoteItemFormErrorMessage(error: unknown): string {
  return generateErrorMessage(error, '品目の処理中にエラーが発生しました');
}
