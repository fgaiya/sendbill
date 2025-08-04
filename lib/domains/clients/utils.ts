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

export const SORT_MAPPING = {
  name_asc: { name: 'asc' },
  name_desc: { name: 'desc' },
  created_asc: { createdAt: 'asc' },
  created_desc: { createdAt: 'desc' },
} as const;

// ソートオプションはマッピングから自動生成
export const CLIENT_SORT_OPTIONS = Object.keys(SORT_MAPPING) as Array<
  keyof typeof SORT_MAPPING
>;

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
    .nullable()
    .optional()
    .default('1')
    .transform(Number)
    .pipe(z.number().min(1)),
  limit: z
    .string()
    .nullable()
    .optional()
    .default('20')
    .transform(Number)
    .pipe(z.number().min(1).max(100)),
});

const includeSchemaPart = z
  .string()
  .nullable()
  .optional()
  .transform((val) => (val ? val.split(',') : []))
  .pipe(z.array(z.enum(CLIENT_INCLUDE_OPTIONS)));

export const clientSearchSchema = z.object({
  q: z.string().nullable().optional(),
  sort: z.enum(CLIENT_SORT_OPTIONS).optional().default('created_desc'),
  include: includeSchemaPart,
});

export const dedicatedSearchSchema = z.object({
  q: z.string().min(1, '検索キーワードは必須です'),
  limit: z
    .string()
    .nullable()
    .optional()
    .default('10')
    .transform(Number)
    .pipe(z.number().min(1).max(50)),
  include: includeSchemaPart,
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
  return SORT_MAPPING[sort] ?? { createdAt: 'desc' };
}

/**
 * フォームデータの前処理（空文字をundefinedに変換）
 */
export function preprocessClientFormData(data: Record<string, unknown>) {
  const processed = { ...data };

  // 空文字列をundefinedに変換（オプショナルフィールド用）
  Object.keys(processed).forEach((key) => {
    if (processed[key] === '') {
      processed[key] = undefined;
    }
  });

  return processed;
}

/**
 * フォーム送信時のエラーメッセージを生成
 */
export function generateClientFormErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // API エラーメッセージをそのまま使用
    return error.message;
  }

  return '取引先の登録中にエラーが発生しました';
}
