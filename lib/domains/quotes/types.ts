import {
  QuoteStatus,
  Quote as PrismaQuote,
  QuoteItem as PrismaQuoteItem,
  Client as PrismaClientModel,
} from '@prisma/client';

import { Client } from '@/lib/shared/types';

import {
  QuoteFormData,
  QuoteUpdateData,
  QuoteItemFormData,
  QuoteItemUpdateData,
  BulkQuoteItemsData,
  QuoteSearchParams,
} from './schemas';

/**
 * サービス層で使用するPrisma型（Decimal型を含む）
 */
export type QuoteWithRelations = PrismaQuote & {
  client?: PrismaClientModel;
  items?: PrismaQuoteItem[];
};

/**
 * API層で使用するドメイン型（number型に変換済み）
 */
export interface Quote {
  id: string;
  companyId: string;
  clientId: string;
  quoteNumber: string;
  issueDate: Date;
  expiryDate: Date | null;
  status: QuoteStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  client?: Client;
  items?: QuoteItem[];
}

export interface QuoteItem {
  id: string;
  quoteId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxCategory: 'STANDARD' | 'REDUCED' | 'EXEMPT' | 'NON_TAX';
  taxRate: number | null;
  discountAmount: number;
  unit: string | null;
  sku: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 会社型定義（税計算用）
 */
export interface Company {
  id: string;
  standardTaxRate: number;
  reducedTaxRate: number;
  priceIncludesTax: boolean;
  quoteNumberSeq: number;
}

/**
 * 見積書一覧レスポンス型
 */
export interface QuotesListResponse {
  data: Quote[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * 見積書検索レスポンス型
 */
export interface QuotesSearchResponse {
  data: Quote[];
  total: number;
}

/**
 * バルク処理アクション型
 */
export type BulkAction = 'create' | 'update' | 'delete';

/**
 * バルク処理品目型
 */
export type BulkQuoteItem =
  | { action: 'create'; data: QuoteItemFormData }
  | { action: 'update'; id: string; data: QuoteItemFormData }
  | { action: 'delete'; id: string };

/**
 * CSVインポート結果型
 */
export interface CsvImportResult {
  success: boolean;
  imported: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

/**
 * 税計算結果型
 */
export interface TaxCalculationResult {
  subtotalAmount: number;
  taxAmountStandard: number;
  taxAmountReduced: number;
  taxAmountExempt: number;
  totalAmount: number;
}

/**
 * 見積書番号生成オプション型
 */
export interface QuoteNumberGenerationOptions {
  companyId: string;
  format?: string; // デフォルト: "Q{seq:04d}"
}

/**
 * エラーレスポンス型
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: unknown;
}

/**
 * 成功レスポンス型
 */
export interface ApiSuccessResponse<T = unknown> {
  data: T;
  message?: string;
}

/**
 * ソートオプション型
 */
export type QuoteSortOption =
  | 'issueDate_asc'
  | 'issueDate_desc'
  | 'createdAt_asc'
  | 'createdAt_desc'
  | 'quoteNumber_asc'
  | 'quoteNumber_desc';

/**
 * include オプション型
 */
export type QuoteIncludeOption = 'client' | 'items';

/**
 * ステータス遷移ルール型
 */
export interface StatusTransitionRule {
  from: QuoteStatus;
  to: QuoteStatus[];
  requiresItems?: boolean;
  requiresNumberGeneration?: boolean;
}

/**
 * Prismaインクルード設定型
 */
export interface QuoteIncludeConfig {
  client?: boolean;
  items?:
    | boolean
    | {
        orderBy?: {
          sortOrder?: 'asc' | 'desc';
        };
      };
}

/**
 * 見積書フィルター条件型
 */
export interface QuoteFilterConditions {
  companyId: string;
  deletedAt?: null;
  status?: QuoteStatus;
  clientId?: string;
  issueDate?: {
    gte?: Date;
    lte?: Date;
  };
  OR?: Array<{
    quoteNumber?: {
      contains: string;
      mode: 'insensitive';
    };
    notes?: {
      contains: string;
      mode: 'insensitive';
    };
    client?: {
      name?: {
        contains: string;
        mode: 'insensitive';
      };
    };
  }>;
}

/**
 * Prisma型からドメイン型への変換関数
 */
export function convertPrismaQuoteToQuote(
  prismaQuote: QuoteWithRelations
): Quote {
  return {
    id: prismaQuote.id,
    companyId: prismaQuote.companyId,
    clientId: prismaQuote.clientId,
    quoteNumber: prismaQuote.quoteNumber,
    issueDate: prismaQuote.issueDate,
    expiryDate: prismaQuote.expiryDate,
    status: prismaQuote.status,
    notes: prismaQuote.notes,
    createdAt: prismaQuote.createdAt,
    updatedAt: prismaQuote.updatedAt,
    deletedAt: prismaQuote.deletedAt,
    client: prismaQuote.client
      ? {
          id: prismaQuote.client.id,
          companyId: prismaQuote.client.companyId,
          name: prismaQuote.client.name,
          contactName: prismaQuote.client.contactName ?? undefined,
          contactEmail: prismaQuote.client.contactEmail ?? undefined,
          address: prismaQuote.client.address ?? undefined,
          phone: prismaQuote.client.phone ?? undefined,
          createdAt: prismaQuote.client.createdAt.toISOString(),
          updatedAt: prismaQuote.client.updatedAt.toISOString(),
          deletedAt: prismaQuote.client.deletedAt?.toISOString() ?? undefined,
        }
      : undefined,
    items: prismaQuote.items
      ? prismaQuote.items.map(convertPrismaQuoteItemToQuoteItem)
      : undefined,
  } satisfies Quote;
}

export function convertPrismaQuoteItemToQuoteItem(
  prismaItem: PrismaQuoteItem
): QuoteItem {
  return {
    id: prismaItem.id,
    quoteId: prismaItem.quoteId,
    description: prismaItem.description,
    quantity: Number(prismaItem.quantity),
    unitPrice: Number(prismaItem.unitPrice),
    taxCategory: prismaItem.taxCategory,
    taxRate: prismaItem.taxRate === null ? null : Number(prismaItem.taxRate),
    discountAmount: Number(prismaItem.discountAmount),
    unit: prismaItem.unit,
    sku: prismaItem.sku,
    sortOrder: prismaItem.sortOrder,
    createdAt: prismaItem.createdAt,
    updatedAt: prismaItem.updatedAt,
  } satisfies QuoteItem;
}

/**
 * エクスポート型定義
 */
export type {
  QuoteFormData,
  QuoteUpdateData,
  QuoteItemFormData,
  QuoteItemUpdateData,
  BulkQuoteItemsData,
  QuoteSearchParams,
};
