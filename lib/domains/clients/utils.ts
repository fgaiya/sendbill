import { z } from 'zod';

/**
 * クライアントドメイン共通ユーティリティ
 */

// 共通定数
export const CLIENT_SEARCH_FIELDS = [
  'name',
  'contactName',
  'contactEmail',
  'address',
] as const;
export const CLIENT_SORT_OPTIONS = [
  'name_asc',
  'name_desc',
  'created_asc',
  'created_desc',
] as const;
export const CLIENT_INCLUDE_OPTIONS = ['invoices', 'quotes'] as const;

// 共通スキーマ
export const includeSchema = z.object({
  include: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',') : []))
    .pipe(z.array(z.enum(CLIENT_INCLUDE_OPTIONS))),
});

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .pipe(z.number().min(1)),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform(Number)
    .pipe(z.number().min(1).max(100)),
});

export const clientSearchSchema = z.object({
  q: z.string().optional(),
  sort: z.enum(CLIENT_SORT_OPTIONS).optional().default('created_desc'),
  include: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',') : []))
    .pipe(z.array(z.enum(CLIENT_INCLUDE_OPTIONS))),
});

export const dedicatedSearchSchema = z.object({
  q: z.string().min(1, '検索キーワードは必須です'),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform(Number)
    .pipe(z.number().min(1).max(50)),
  include: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',') : []))
    .pipe(z.array(z.enum(CLIENT_INCLUDE_OPTIONS))),
});

/**
 * 関連データ取得設定を構築
 */
export function buildIncludeRelations(
  include: (typeof CLIENT_INCLUDE_OPTIONS)[number][]
): Record<string, boolean> {
  return include.reduce(
    (acc, key) => {
      acc[key] = true;
      return acc;
    },
    {} as Record<string, boolean>
  );
}

/**
 * クライアント検索WHERE条件を構築
 */
export function buildClientSearchWhere(userId: string, query?: string) {
  return {
    userId,
    ...(query && {
      OR: CLIENT_SEARCH_FIELDS.map((field) => ({
        [field]: { contains: query, mode: 'insensitive' as const },
      })),
    }),
  };
}

/**
 * ソート条件を構築
 */
export function buildOrderBy(
  sort: (typeof CLIENT_SORT_OPTIONS)[number]
): Record<string, string> {
  switch (sort) {
    case 'name_asc':
      return { name: 'asc' };
    case 'name_desc':
      return { name: 'desc' };
    case 'created_asc':
      return { createdAt: 'asc' };
    case 'created_desc':
      return { createdAt: 'desc' };
    default:
      return { createdAt: 'desc' };
  }
}
