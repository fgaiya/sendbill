import { z } from 'zod';

import { PAGINATION } from '@/lib/shared/constants';

/**
 * 見積書基本スキーマ
 */
export const baseQuoteSchema = z.object({
  clientId: z.string().min(1, 'クライアントIDは必須です'),
  issueDate: z.coerce.date(),
  expiryDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

/**
 * 見積書作成スキーマ
 */
export const createQuoteSchema = baseQuoteSchema.refine(
  (data) => !data.expiryDate || data.issueDate <= data.expiryDate,
  {
    message: '有効期限は発行日以降である必要があります',
    path: ['expiryDate'],
  }
);

/**
 * 見積書更新スキーマ
 */
export const updateQuoteSchema = baseQuoteSchema
  .partial()
  .refine(
    (data) =>
      !data.expiryDate || !data.issueDate || data.issueDate <= data.expiryDate,
    {
      message: '有効期限は発行日以降である必要があります',
      path: ['expiryDate'],
    }
  )
  .and(z.object({ updatedAt: z.coerce.date() }));

/**
 * 見積書品目基本スキーマ
 */
export const baseQuoteItemSchema = z.object({
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
 * 見積書品目作成スキーマ
 */
export const createQuoteItemSchema = baseQuoteItemSchema.refine(
  (data) => data.discountAmount <= data.unitPrice * data.quantity,
  {
    message: '割引額は品目合計金額を超えることはできません',
    path: ['discountAmount'],
  }
);

/**
 * 見積書品目更新スキーマ
 */
export const updateQuoteItemSchema = baseQuoteItemSchema
  .partial()
  .refine(
    (data) => {
      if (
        data.discountAmount !== undefined &&
        data.unitPrice !== undefined &&
        data.quantity !== undefined
      ) {
        return data.discountAmount <= data.unitPrice * data.quantity;
      }
      return true;
    },
    {
      message: '割引額は品目合計金額を超えることはできません',
      path: ['discountAmount'],
    }
  )
  .and(z.object({ updatedAt: z.coerce.date() }));

/**
 * 見積書品目バルク処理スキーマ
 */
const bulkCreateItemSchema = z.object({
  action: z.literal('create'),
  data: createQuoteItemSchema,
});

const bulkUpdateItemSchema = z.object({
  action: z.literal('update'),
  id: z.string().min(1, '更新時はIDが必須です'),
  data: updateQuoteItemSchema,
});

const bulkDeleteItemSchema = z.object({
  action: z.literal('delete'),
  id: z.string().min(1, '削除時はIDが必須です'),
});

export const bulkQuoteItemsSchema = z.object({
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
 * 見積書検索パラメータスキーマ
 */
export const quoteSearchSchema = z
  .object({
    q: z.string().min(1, '検索キーワードは必須です'),
    status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'DECLINED']).optional(),
    clientId: z.preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
      z.string().optional()
    ),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    sort: z
      .enum([
        'issueDate_asc',
        'issueDate_desc',
        'createdAt_asc',
        'createdAt_desc',
        'quoteNumber_asc',
        'quoteNumber_desc',
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
      z.array(z.enum(['client', 'items']))
    ),
  })
  .refine((d) => !(d.dateFrom && d.dateTo) || d.dateFrom <= d.dateTo, {
    path: ['dateTo'],
    message: '終了日は開始日以降である必要があります',
  });

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
    z.array(z.enum(['client', 'items']))
  ),
});

/**
 * 型エクスポート
 */
export type QuoteData = z.infer<typeof createQuoteSchema>;
export type QuoteUpdateData = z.infer<typeof updateQuoteSchema>;
export type QuoteItemData = z.infer<typeof createQuoteItemSchema>;
export type QuoteItemUpdateData = z.infer<typeof updateQuoteItemSchema>;
export type BulkQuoteItemsData = z.infer<typeof bulkQuoteItemsSchema>;
export type QuoteSearchParams = z.infer<typeof quoteSearchSchema>;

/**
 * スキーマ集約オブジェクト
 */
export const quoteSchemas = {
  create: createQuoteSchema,
  update: updateQuoteSchema,
};

export const quoteItemSchemas = {
  create: createQuoteItemSchema,
  update: updateQuoteItemSchema,
  bulk: bulkQuoteItemsSchema,
};

/**
 * 品目の部分更新（単一）: 並び順の変更は除外
 */
export const patchQuoteItemSchema = baseQuoteItemSchema
  .omit({ sortOrder: true })
  .partial()
  .refine(
    (data) => {
      if (
        data.discountAmount !== undefined &&
        data.unitPrice !== undefined &&
        data.quantity !== undefined
      ) {
        return data.discountAmount <= data.unitPrice * data.quantity;
      }
      return true;
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
export const reorderQuoteItemsSchema = z.object({
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

export type QuoteItemPatchData = z.infer<typeof patchQuoteItemSchema>;
export type ReorderQuoteItemsData = z.infer<typeof reorderQuoteItemsSchema>;
