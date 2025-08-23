import {
  InvoiceStatus as PrismaInvoiceStatus,
  Invoice as PrismaInvoice,
  InvoiceItem as PrismaInvoiceItem,
  Client as PrismaClientModel,
  Quote as PrismaQuote,
} from '@prisma/client';

export type InvoiceStatus = PrismaInvoiceStatus;

import { Client } from '@/lib/shared/types';

import { InvoiceItemData, InvoiceItemUpdateData } from './schemas';

/**
 * サービス層で使用するPrisma型（Decimal型を含む）
 */
export type InvoiceWithRelations = PrismaInvoice & {
  client?: PrismaClientModel;
  items?: PrismaInvoiceItem[];
  quote?: PrismaQuote | null;
};

/**
 * API層で使用するドメイン型（number型に変換済み）
 */
export interface Invoice {
  id: string;
  companyId: string;
  clientId: string;
  quoteId: string | null;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string | null;
  status: InvoiceStatus;
  notes: string | null;
  paymentDate: string | null;
  paymentMethod?: 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CASH' | 'CHECK' | null;
  paymentTerms?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  client?: Client;
  items?: InvoiceItem[];
  quote?: {
    id: string;
    quoteNumber: string;
    issueDate: string;
    status: string;
  };
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxCategory: 'STANDARD' | 'REDUCED' | 'EXEMPT' | 'NON_TAX';
  taxRate: number | null;
  discountAmount: number;
  unit: string | null;
  sku: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 会社型定義（税計算・番号採番用）
 */
export interface Company {
  id: string;
  standardTaxRate: number;
  reducedTaxRate: number;
  priceIncludesTax: boolean;
  invoiceNumberSeq: number;
}

/**
 * Company with bank info and tax registration for payment fields
 */
export interface CompanyWithBankInfo extends Company {
  invoiceRegistrationNumber?: string | null;
  bankName?: string | null;
  bankBranch?: string | null;
  bankAccountNumber?: string | null;
  bankAccountHolder?: string | null;
}

/**
 * 会社設定のデフォルト値（請求書用）
 */
export const DEFAULT_COMPANY_WITH_BANK: Omit<CompanyWithBankInfo, 'id'> = {
  standardTaxRate: 10,
  reducedTaxRate: 8,
  priceIncludesTax: false,
  invoiceNumberSeq: 1,
  invoiceRegistrationNumber: null,
  bankName: null,
  bankBranch: null,
  bankAccountNumber: null,
  bankAccountHolder: null,
};

/**
 * 請求書一覧レスポンス型
 */
export interface InvoicesListResponse {
  data: Invoice[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * 請求書検索レスポンス型
 */
export interface InvoicesSearchResponse {
  data: Invoice[];
  total: number;
}

/**
 * バルク処理アクション型
 */
export type BulkAction = 'create' | 'update' | 'delete';

/**
 * バルク処理品目型
 */
export type BulkInvoiceItem =
  | { action: 'create'; data: InvoiceItemData }
  | { action: 'update'; id: string; data: InvoiceItemUpdateData }
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
 * 請求書番号生成オプション型
 */
export interface InvoiceNumberGenerationOptions {
  companyId: string;
  format?: string; // デフォルト: "I{seq:04d}"
}

/**
 * 見積書から請求書作成結果型
 */
export interface CreateInvoiceFromQuoteResult {
  invoice: InvoiceWithRelations;
  duplicatedItemsCount: number;
  totalItemsCount: number;
}

/**
 * 支払情報型
 */
export interface PaymentInfo {
  status: InvoiceStatus;
  paymentDate: string | null;
  dueDate: string | null;
  daysOverdue?: number;
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
export type InvoiceSortOption =
  | 'issueDate_asc'
  | 'issueDate_desc'
  | 'dueDate_asc'
  | 'dueDate_desc'
  | 'createdAt_asc'
  | 'createdAt_desc'
  | 'invoiceNumber_asc'
  | 'invoiceNumber_desc';

/**
 * include オプション型
 */
export type InvoiceIncludeOption = 'client' | 'items' | 'quote';

/**
 * ステータス遷移ルール型
 */
export interface StatusTransitionRule {
  from: InvoiceStatus;
  to: InvoiceStatus[];
  requiresItems?: boolean;
  requiresNumberGeneration?: boolean;
  requiresPaymentDate?: boolean;
}

/**
 * Prismaインクルード設定型
 */
export interface InvoiceIncludeConfig {
  client?: boolean;
  items?:
    | boolean
    | {
        orderBy?: {
          sortOrder?: 'asc' | 'desc';
        };
      };
  quote?:
    | boolean
    | {
        select?: {
          id: boolean;
          quoteNumber: boolean;
          issueDate: boolean;
          status: boolean;
        };
      };
}

/**
 * 請求書フィルター条件型
 */
export interface InvoiceFilterConditions {
  companyId: string;
  deletedAt?: null;
  status?: InvoiceStatus;
  clientId?: string;
  quoteId?: string;
  issueDate?: {
    gte?: Date;
    lte?: Date;
  };
  dueDate?: {
    gte?: Date;
    lte?: Date;
  };
  OR?: Array<{
    invoiceNumber?: {
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
 * 支払期限オーバー判定結果型
 */
export interface OverdueCheckResult {
  isOverdue: boolean;
  daysOverdue: number;
  shouldUpdateStatus: boolean;
}

/**
 * Prisma型からドメイン型への変換関数
 */
export function convertPrismaInvoiceToInvoice(
  prismaInvoice: InvoiceWithRelations
): Invoice {
  return {
    id: prismaInvoice.id,
    companyId: prismaInvoice.companyId,
    clientId: prismaInvoice.clientId,
    quoteId: prismaInvoice.quoteId,
    invoiceNumber: prismaInvoice.invoiceNumber,
    issueDate: prismaInvoice.issueDate.toISOString(),
    dueDate: prismaInvoice.dueDate?.toISOString() ?? null,
    status: prismaInvoice.status,
    notes: prismaInvoice.notes,
    paymentDate: prismaInvoice.paymentDate?.toISOString() ?? null,
    paymentMethod:
      (
        prismaInvoice as InvoiceWithRelations & {
          paymentMethod?:
            | 'BANK_TRANSFER'
            | 'CREDIT_CARD'
            | 'CASH'
            | 'CHECK'
            | null;
        }
      ).paymentMethod ?? null,
    paymentTerms:
      (prismaInvoice as InvoiceWithRelations & { paymentTerms?: string | null })
        .paymentTerms ?? null,
    createdAt: prismaInvoice.createdAt.toISOString(),
    updatedAt: prismaInvoice.updatedAt.toISOString(),
    deletedAt: prismaInvoice.deletedAt?.toISOString() ?? null,
    client: prismaInvoice.client
      ? {
          id: prismaInvoice.client.id,
          companyId: prismaInvoice.client.companyId,
          name: prismaInvoice.client.name,
          contactName: prismaInvoice.client.contactName ?? undefined,
          contactEmail: prismaInvoice.client.contactEmail ?? undefined,
          address: prismaInvoice.client.address ?? undefined,
          phone: prismaInvoice.client.phone ?? undefined,
          createdAt: prismaInvoice.client.createdAt.toISOString(),
          updatedAt: prismaInvoice.client.updatedAt.toISOString(),
          deletedAt: prismaInvoice.client.deletedAt?.toISOString() ?? undefined,
        }
      : undefined,
    // items配列が存在する場合は変換、存在しない場合はundefined
    items: prismaInvoice.items
      ? prismaInvoice.items.map(convertPrismaInvoiceItemToInvoiceItem)
      : undefined,
    // quote情報が存在する場合は変換
    quote: prismaInvoice.quote
      ? {
          id: prismaInvoice.quote.id,
          quoteNumber: prismaInvoice.quote.quoteNumber,
          issueDate: prismaInvoice.quote.issueDate.toISOString(),
          status: prismaInvoice.quote.status,
        }
      : undefined,
  } satisfies Invoice;
}

export function convertPrismaInvoiceItemToInvoiceItem(
  prismaItem: PrismaInvoiceItem
): InvoiceItem {
  return {
    id: prismaItem.id,
    invoiceId: prismaItem.invoiceId,
    description: prismaItem.description,
    quantity: Number(prismaItem.quantity),
    unitPrice: Number(prismaItem.unitPrice),
    taxCategory: prismaItem.taxCategory,
    taxRate: prismaItem.taxRate === null ? null : Number(prismaItem.taxRate),
    discountAmount: Number(prismaItem.discountAmount),
    unit: prismaItem.unit,
    sku: prismaItem.sku,
    sortOrder: prismaItem.sortOrder,
    createdAt: prismaItem.createdAt.toISOString(),
    updatedAt: prismaItem.updatedAt.toISOString(),
  } satisfies InvoiceItem;
}

/**
 * 支払期限オーバーチェック関数
 */
export function checkOverdueStatus(
  invoice: Pick<Invoice, 'dueDate' | 'status' | 'paymentDate'>
): OverdueCheckResult {
  if (!invoice.dueDate || invoice.status === 'PAID' || invoice.paymentDate) {
    return {
      isOverdue: false,
      daysOverdue: 0,
      shouldUpdateStatus: false,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // 時刻を0時に設定
  const dueDate = new Date(invoice.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  const daysOverdue = Math.floor(
    (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const isOverdue = daysOverdue > 0;
  const shouldUpdateStatus = isOverdue && invoice.status === 'SENT';

  return {
    isOverdue,
    daysOverdue: Math.max(0, daysOverdue),
    shouldUpdateStatus,
  };
}

/**
 * UI層で使用するフォーム型制約（コンポーネント用）
 * React Hook Form の Control<T> のジェネリクス制約として使用
 */
export interface InvoiceBasicsShape {
  clientId: string;
  clientName?: string;
  issueDate: Date;
  dueDate?: Date;
  notes?: string;
  quoteId?: string;
}

/**
 * Payment method shape for invoice forms
 */
export interface InvoicePaymentShape {
  paymentMethod?: 'BANK_TRANSFER' | 'CREDIT_CARD' | 'CASH' | 'CHECK';
  paymentTerms?: string;
}

/**
 * 支払管理フォーム型制約
 */
export interface PaymentFormShape {
  status: InvoiceStatus;
  paymentDate?: Date;
}

/**
 * エクスポート型定義（API層用）
 */
export type {
  InvoiceData,
  InvoiceUpdateData,
  InvoiceItemData,
  InvoiceItemUpdateData,
  BulkInvoiceItemsData,
  InvoiceSearchParams,
  CreateInvoiceFromQuoteData,
  UpdatePaymentData,
} from './schemas';
