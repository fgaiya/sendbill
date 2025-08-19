import { z } from 'zod';

import { PAGINATION } from '@/lib/shared/constants';

/**
 * 請求書基本スキーマ
 */
export const baseInvoiceSchema = z.object({
  clientId: z.string().min(1, 'クライアントIDは必須です'),
  issueDate: z.coerce.date(),
  dueDate: z.preprocess(
    (val) => (val === null || val === '' ? undefined : val),
    z.coerce.date().optional()
  ),
  notes: z.string().optional(),
  quoteId: z.string().optional(), // 見積書からの複製時に使用
});

/**
 * 請求書作成スキーマ
 */
export const createInvoiceSchema = baseInvoiceSchema.refine(
  (data) => !data.dueDate || data.issueDate <= data.dueDate,
  {
    message: '支払期限は発行日以降である必要があります',
    path: ['dueDate'],
  }
);

/**
 * 請求書更新スキーマ
 */
export const updateInvoiceSchema = baseInvoiceSchema
  .partial()
  .refine(
    (data) =>
      !data.dueDate || !data.issueDate || data.issueDate <= data.dueDate,
    {
      message: '支払期限は発行日以降である必要があります',
      path: ['dueDate'],
    }
  )
  .and(z.object({ updatedAt: z.coerce.date() }));

/**
 * 請求書品目基本スキーマ
 */
export const baseInvoiceItemSchema = z.object({
  description: z.string().min(1, '品目名は必須です'),
  quantity: z.coerce.number().positive('数量は正の数である必要があります'),
  unitPrice: z.coerce.number().nonnegative('単価は0以上である必要があります'),
  taxCategory: z
    .enum(['STANDARD', 'REDUCED', 'EXEMPT', 'NON_TAX'])
    .default('STANDARD'),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  discountAmount: z.coerce
    .number()
    .nonnegative('割引額は0以上である必要があります')
    .default(0),
  unit: z.string().optional(),
  sku: z.string().optional(),
  sortOrder: z.coerce.number().int().nonnegative().default(0),
});

/**
 * 請求書品目作成スキーマ
 */
export const createInvoiceItemSchema = baseInvoiceItemSchema.refine(
  (data) => data.discountAmount <= data.unitPrice * data.quantity,
  {
    message: '割引額は品目合計金額を超えることはできません',
    path: ['discountAmount'],
  }
);

/**
 * 請求書品目更新スキーマ
 */
export const updateInvoiceItemSchema = baseInvoiceItemSchema
  .partial()
  .refine(
    (data) => {
      // 割引額が設定されている場合のみ検証
      if (data.discountAmount === undefined) {
        return true;
      }

      // 既存の値を取得する必要があるため、検証をスキップ
      // （実際のビジネスロジック層で既存値との結合後に検証）
      if (data.unitPrice === undefined || data.quantity === undefined) {
        return true;
      }

      return data.discountAmount <= data.unitPrice * data.quantity;
    },
    {
      message: '割引額は品目合計金額を超えることはできません',
      path: ['discountAmount'],
    }
  )
  .and(z.object({ updatedAt: z.coerce.date() }));

/**
 * 請求書品目バルク処理スキーマ
 */
const bulkCreateItemSchema = z.object({
  action: z.literal('create'),
  data: createInvoiceItemSchema,
});

const bulkUpdateItemSchema = z.object({
  action: z.literal('update'),
  id: z.string().min(1, '更新時はIDが必須です'),
  data: updateInvoiceItemSchema,
});

const bulkDeleteItemSchema = z.object({
  action: z.literal('delete'),
  id: z.string().min(1, '削除時はIDが必須です'),
});

export const bulkInvoiceItemsSchema = z.object({
  items: z
    .array(
      z.discriminatedUnion('action', [
        bulkCreateItemSchema,
        bulkUpdateItemSchema,
        bulkDeleteItemSchema,
      ])
    )
    .min(1, '最低1つの品目が必要です'),
});

/**
 * CSVインポートスキーマ
 */
export const csvImportSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => {
      const t = (file.type || '').toLowerCase();
      return (
        file.name.toLowerCase().endsWith('.csv') ||
        t === 'text/csv' ||
        t === 'application/csv' ||
        t === 'application/vnd.ms-excel'
      );
    },
    {
      message: 'CSVファイルを選択してください',
    }
  ),
  overwrite: z.boolean().default(false), // 既存品目を上書きするか
});

/**
 * 請求書検索パラメータスキーマ
 */
export const invoiceSearchSchema = z
  .object({
    q: z.preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
      z.string().optional()
    ),
    status: z.preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
      z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE']).optional()
    ),
    clientId: z.preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
      z.string().optional()
    ),
    quoteId: z.preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
      z.string().optional()
    ),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    dueDateFrom: z.coerce.date().optional(),
    dueDateTo: z.coerce.date().optional(),
    sort: z
      .enum([
        'issueDate_asc',
        'issueDate_desc',
        'dueDate_asc',
        'dueDate_desc',
        'createdAt_asc',
        'createdAt_desc',
        'invoiceNumber_asc',
        'invoiceNumber_desc',
      ])
      .default('createdAt_desc'),
    include: z.preprocess(
      (val) => {
        if (Array.isArray(val)) {
          return val
            .flatMap((v) => String(v).split(','))
            .map((s) => s.trim())
            .filter(Boolean);
        }
        if (typeof val === 'string') {
          return val
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        }
        return [];
      },
      z.array(z.enum(['client', 'items', 'quote']))
    ),
  })
  .refine((d) => !(d.dateFrom && d.dateTo) || d.dateFrom <= d.dateTo, {
    path: ['dateTo'],
    message: '発行日終了日は開始日以降である必要があります',
  })
  .refine(
    (d) => !(d.dueDateFrom && d.dueDateTo) || d.dueDateFrom <= d.dueDateTo,
    {
      path: ['dueDateTo'],
      message: '支払期限終了日は開始日以降である必要があります',
    }
  );

/**
 * ページネーションスキーマ
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .nullable()
    .optional()
    .default(String(PAGINATION.DEFAULT_PAGE))
    .transform(Number)
    .pipe(z.number().min(1)),
  limit: z
    .string()
    .nullable()
    .optional()
    .default(String(PAGINATION.DEFAULT_LIMIT))
    .transform(Number)
    .pipe(z.number().min(1).max(PAGINATION.MAX_LIMIT)),
});

/**
 * includeパラメータスキーマ
 */
export const includeSchema = z.object({
  include: z.preprocess(
    (val) =>
      typeof val === 'string'
        ? val
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    z.array(z.enum(['client', 'items', 'quote']))
  ),
});

/**
 * 見積書から請求書作成スキーマ
 */
export const createInvoiceFromQuoteSchema = z
  .object({
    issueDate: z.coerce.date(),
    dueDate: z.preprocess(
      (val) => (val === null || val === '' ? undefined : val),
      z.coerce.date().optional()
    ),
    notes: z.string().optional(),
    selectedItemIds: z
      .array(z.string())
      .min(1, '最低1つの品目を選択してください')
      .optional(), // 未指定時は全品目を複製
  })
  .refine((data) => !data.dueDate || data.issueDate <= data.dueDate, {
    message: '支払期限は発行日以降である必要があります',
    path: ['dueDate'],
  });

/**
 * 支払情報更新スキーマ
 */
export const updatePaymentSchema = z
  .object({
    status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE']),
    paymentDate: z.preprocess(
      (val) => (val === null || val === '' ? undefined : val),
      z.coerce.date().optional()
    ),
  })
  .refine(
    (data) => {
      if (data.status === 'PAID' && !data.paymentDate) {
        return false;
      }
      return true;
    },
    {
      message: '支払済みステータスには支払日が必要です',
      path: ['paymentDate'],
    }
  );

/**
 * 型エクスポート
 */
export type InvoiceData = z.infer<typeof createInvoiceSchema>;
export type InvoiceUpdateData = z.infer<typeof updateInvoiceSchema>;
export type InvoiceItemData = z.infer<typeof createInvoiceItemSchema>;
export type InvoiceItemUpdateData = z.infer<typeof updateInvoiceItemSchema>;
export type BulkInvoiceItemsData = z.infer<typeof bulkInvoiceItemsSchema>;
export type InvoiceSearchParams = z.infer<typeof invoiceSearchSchema>;
export type CreateInvoiceFromQuoteData = z.infer<
  typeof createInvoiceFromQuoteSchema
>;
export type UpdatePaymentData = z.infer<typeof updatePaymentSchema>;

/**
 * 請求書ステータス更新スキーマ
 */
export const statusUpdateInvoiceSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE']),
});

/**
 * スキーマ集約オブジェクト
 */
export const invoiceSchemas = {
  create: createInvoiceSchema,
  update: updateInvoiceSchema,
  statusUpdate: statusUpdateInvoiceSchema,
  createFromQuote: createInvoiceFromQuoteSchema,
  updatePayment: updatePaymentSchema,
};

export const invoiceItemSchemas = {
  create: createInvoiceItemSchema,
  update: updateInvoiceItemSchema,
  bulk: bulkInvoiceItemsSchema,
};

/**
 * 品目の部分更新（単一）: 並び順の変更は除外
 */
export const patchInvoiceItemSchema = baseInvoiceItemSchema
  .omit({ sortOrder: true })
  .partial()
  .refine(
    (data) => {
      // 割引額が設定されている場合のみ検証
      if (data.discountAmount === undefined) {
        return true;
      }

      // 既存の値を取得する必要があるため、検証をスキップ
      // （実際のビジネスロジック層で既存値との結合後に検証）
      if (data.unitPrice === undefined || data.quantity === undefined) {
        return true;
      }

      return data.discountAmount <= data.unitPrice * data.quantity;
    },
    {
      message: '割引額は品目合計金額を超えることはできません',
      path: ['discountAmount'],
    }
  )
  .and(z.object({ updatedAt: z.coerce.date() }));

/**
 * 品目の並び順一括更新（部分更新）
 */
export const reorderInvoiceItemsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1, 'IDは必須です'),
        sortOrder: z.coerce.number().int().nonnegative(),
        updatedAt: z.coerce.date(),
      })
    )
    .min(1, '最低1つの品目が必要です'),
});

export type InvoiceItemPatchData = z.infer<typeof patchInvoiceItemSchema>;
export type ReorderInvoiceItemsData = z.infer<typeof reorderInvoiceItemsSchema>;
