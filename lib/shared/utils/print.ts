import type { InvoiceItemFormData } from '@/lib/domains/invoices/form-schemas';
import type { CompanyForCalculation } from '@/lib/domains/quotes/calculations';
import type { QuoteItemFormData } from '@/lib/domains/quotes/form-schemas';

/**
 * プレビュー用の完全な会社情報型
 */
export interface CompanyForPreview {
  companyName: string;
  businessName?: string;
  postalCode?: string;
  prefecture?: string;
  city?: string;
  street?: string;
  phone?: string;
  contactEmail?: string;
  invoiceRegistrationNumber?: string;
  representativeName?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  bankAccountType?: string;
  standardTaxRate: number;
  reducedTaxRate: number;
  priceIncludesTax: boolean;
}

/**
 * プレビュー用の完全なクライアント情報型
 */
export interface ClientForPreview {
  name: string;
  contactName?: string;
  contactEmail?: string;
  address?: string;
  phone?: string;
}

/**
 * Prismaのアイテムデータをプレビュー用のフォームデータに正規化
 */
export function normalizeItemsForPreview<
  T extends {
    description: string;
    quantity: number | string;
    unitPrice: number | string;
    discountAmount: number | string;
    taxCategory: 'STANDARD' | 'REDUCED' | 'EXEMPT' | 'NON_TAX';
    sortOrder: number;
    taxRate?: number | string | null;
    unit?: string | null;
    sku?: string | null;
  },
>(items: T[]): Array<QuoteItemFormData | InvoiceItemFormData> {
  const toNumberOrZero = (v: number | string): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const toOptionalNumber = (
    v: number | string | null | undefined
  ): number | undefined => {
    if (v === null || v === undefined) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  return items.map((item) => ({
    description: item.description,
    quantity: toNumberOrZero(item.quantity),
    unitPrice: toNumberOrZero(item.unitPrice),
    discountAmount: toNumberOrZero(item.discountAmount),
    taxCategory: item.taxCategory,
    sortOrder: item.sortOrder,
    // 税率の不正値は0%ではなくundefinedへ（計算側の既定ロジックに委譲）
    taxRate: toOptionalNumber(item.taxRate),
    unit: item.unit ?? undefined,
    sku: item.sku ?? undefined,
  }));
}

/**
 * 安全な税率変換ヘルパー（NaN/負値をフォールバック）
 */
const toTaxRate = (
  v: number | string | { toString(): string },
  fallback: number
): number => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

/**
 * Prismaの会社データを計算用の会社データに正規化
 */
export function normalizeCompanyForCalculation(company: {
  standardTaxRate: number | string | { toString(): string };
  reducedTaxRate: number | string | { toString(): string };
  priceIncludesTax: boolean;
}): CompanyForCalculation {
  return {
    standardTaxRate: toTaxRate(company.standardTaxRate, 10), // デフォルト10%
    reducedTaxRate: toTaxRate(company.reducedTaxRate, 8), // デフォルト8%
    priceIncludesTax: company.priceIncludesTax,
  };
}

/**
 * null値をundefinedに変換するヘルパー関数
 */
function nullToUndefined<T>(value: T | null): T | undefined {
  return value ?? undefined;
}

/**
 * Prismaの会社データをプレビュー用の完全な会社データに正規化
 */
export function normalizeCompanyForPreview(company: {
  companyName: string;
  businessName?: string | null;
  postalCode?: string | null;
  prefecture?: string | null;
  city?: string | null;
  street?: string | null;
  phone?: string | null;
  contactEmail?: string | null;
  invoiceRegistrationNumber?: string | null;
  representativeName?: string | null;
  bankName?: string | null;
  bankBranch?: string | null;
  bankAccountNumber?: string | null;
  bankAccountHolder?: string | null;
  bankAccountType?: string | null;
  standardTaxRate: number | string | { toString(): string };
  reducedTaxRate: number | string | { toString(): string };
  priceIncludesTax: boolean;
}): CompanyForPreview {
  return {
    companyName: company.companyName,
    businessName: nullToUndefined(company.businessName),
    postalCode: nullToUndefined(company.postalCode),
    prefecture: nullToUndefined(company.prefecture),
    city: nullToUndefined(company.city),
    street: nullToUndefined(company.street),
    phone: nullToUndefined(company.phone),
    contactEmail: nullToUndefined(company.contactEmail),
    invoiceRegistrationNumber: nullToUndefined(
      company.invoiceRegistrationNumber
    ),
    representativeName: nullToUndefined(company.representativeName),
    bankName: nullToUndefined(company.bankName),
    bankBranch: nullToUndefined(company.bankBranch),
    bankAccountNumber: nullToUndefined(company.bankAccountNumber),
    bankAccountHolder: nullToUndefined(company.bankAccountHolder),
    bankAccountType: nullToUndefined(company.bankAccountType),
    standardTaxRate: toTaxRate(company.standardTaxRate, 10),
    reducedTaxRate: toTaxRate(company.reducedTaxRate, 8),
    priceIncludesTax: company.priceIncludesTax,
  };
}

/**
 * Prismaのクライアントデータをプレビュー用の完全なクライアントデータに正規化
 */
export function normalizeClientForPreview(client: {
  name: string;
  contactName?: string | null;
  contactEmail?: string | null;
  address?: string | null;
  phone?: string | null;
}): ClientForPreview {
  return {
    name: client.name,
    contactName: nullToUndefined(client.contactName),
    contactEmail: nullToUndefined(client.contactEmail),
    address: nullToUndefined(client.address),
    phone: nullToUndefined(client.phone),
  };
}

/**
 * 印刷プレビュー用の共通データ変換
 */
export function preparePrintPreviewData<
  T extends Parameters<typeof normalizeItemsForPreview>[0][0],
>(
  items: T[],
  company: Parameters<typeof normalizeCompanyForPreview>[0],
  client?: Parameters<typeof normalizeClientForPreview>[0]
) {
  return {
    formattedItems: normalizeItemsForPreview(items),
    companyForCalculation: normalizeCompanyForCalculation(company),
    companyForPreview: normalizeCompanyForPreview(company),
    clientForPreview: client ? normalizeClientForPreview(client) : undefined,
  };
}
