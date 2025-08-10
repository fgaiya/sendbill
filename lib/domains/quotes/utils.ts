import { Prisma, QuoteStatus } from '@prisma/client';

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
export const QUOTE_SEARCH_FIELDS = ['quoteNumber', 'notes'] as const;

// ソートマッピング
export const QUOTE_SORT_MAPPING: Record<
  QuoteSortOption,
  Prisma.QuoteOrderByWithRelationInput
> = {
  issueDate_asc: { issueDate: 'asc' },
  issueDate_desc: { issueDate: 'desc' },
  created_asc: { createdAt: 'asc' },
  created_desc: { createdAt: 'desc' },
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
 * includeパラメータ処理
 */
const _processIncludeString = (raw: unknown): string[] => {
  if (typeof raw === 'string' && raw.trim() !== '') {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s !== '');
  }
  return [];
};

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
  items: QuoteItem[],
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
    if (item.taxRate !== undefined && item.taxRate !== null) {
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
      (item.taxRate !== undefined && item.taxRate === company.standardTaxRate)
    ) {
      taxAmountStandard += lineTax;
    } else if (
      item.taxCategory === 'REDUCED' ||
      (item.taxRate !== undefined && item.taxRate === company.reducedTaxRate)
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
 * CSVデータをパース
 */
export function parseCSVData(csvText: string): Array<Record<string, string>> {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSVファイルにはヘッダー行とデータ行が必要です');
  }

  const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
  const data: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/"/g, ''));
    if (values.length !== headers.length) {
      throw new Error(`行 ${i + 1} の列数が一致しません`);
    }

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    data.push(row);
  }

  return data;
}

/**
 * エラーメッセージを生成
 */
export function generateQuoteFormErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return '見積書の処理中にエラーが発生しました';
}

/**
 * 品目エラーメッセージを生成
 */
export function generateQuoteItemFormErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return '品目の処理中にエラーが発生しました';
}
