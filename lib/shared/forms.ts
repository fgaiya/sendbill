import { NextResponse } from 'next/server';

import { Prisma } from '@prisma/client';
import { z } from 'zod';

import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '@/lib/shared/utils/errors';

/**
 * フォーム管理の共通バリデーションスキーマ
 */

// 共通バリデーションスキーマ
export const commonValidationSchemas = {
  // 必須文字列（空文字不可）
  requiredString: (fieldName: string) =>
    z.string().min(1, `${fieldName}は必須項目です`).trim(),

  // メールアドレス
  email: z
    .string()
    .min(1, 'メールアドレスは必須項目です')
    .pipe(z.email({ message: '有効なメールアドレスを入力してください' })),

  // メールアドレス（オプショナル、空文字許可）
  optionalEmail: z
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val))
    .pipe(
      z.email({ message: '有効なメールアドレスを入力してください' }).optional()
    ),

  // 電話番号（日本の形式）
  phoneNumber: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val ||
        val === '' ||
        /^(?:0\d{9,10}|0\d{1,4}-\d{1,4}-\d{3,4})$/.test(val),
      '有効な電話番号を入力してください'
    ),

  // 郵便番号（日本の形式）
  postalCode: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === '' || /^\d{3}-\d{4}$/.test(val),
      '郵便番号は000-0000の形式で入力してください'
    ),

  // 金額（正の数）
  amount: z
    .number()
    .positive('金額は0より大きい値を入力してください')
    .max(999999999, '金額が上限を超えています'),

  // 日付
  date: z.date({
    message: '有効な日付を入力してください',
  }),

  // URL
  url: z
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val))
    .pipe(z.url({ message: '有効なURLを入力してください' }).optional()),
};

// 会社情報バリデーションスキーマ
const baseCompanyFields = {
  companyName: commonValidationSchemas.requiredString('会社名'),
  businessName: z.string().optional(),
  logoUrl: commonValidationSchemas.url,
  postalCode: commonValidationSchemas.postalCode,
  prefecture: z.string().optional(),
  city: z.string().optional(),
  street: z.string().optional(),
  phone: commonValidationSchemas.phoneNumber,
  contactEmail: commonValidationSchemas.optionalEmail,
  invoiceRegistrationNumber: z.string().optional(),
  representativeName: z.string().optional(),
  bankName: z.string().optional(),
  bankBranch: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountHolder: z.string().optional(),
};

// 会社フォーム用の型（userId等は除外）
type CompanyFormInput = Omit<
  Prisma.CompanyUncheckedCreateInput,
  'id' | 'createdAt' | 'updatedAt' | 'userId'
>;

export const companySchemas = {
  create: z.object(baseCompanyFields) satisfies z.ZodType<CompanyFormInput>,
  update: z.object({
    ...baseCompanyFields,
    companyName: z.string().min(1, '会社名は必須です').optional(),
  }) satisfies z.ZodType<Partial<CompanyFormInput>>,
};

// API エラーレスポンス共通ユーティリティ
export const apiErrors = {
  unauthorized: () => ({ error: '認証が必要です' }),
  forbidden: () => ({ error: 'アクセス権限がありません' }),
  notFound: (resource: string) => ({ error: `${resource}が見つかりません` }),
  conflict: (message: string) => ({ error: message }),
  validation: (details: z.ZodError['issues']) => ({
    error: 'バリデーションエラー',
    details,
  }),
  internal: () => ({ error: 'サーバーエラーが発生しました' }),
};

// API エラーハンドリング共通ロジック
export function handleApiError(error: unknown, context: string) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(apiErrors.validation(error.issues), {
      status: 400,
    });
  }

  // ドメインエラー → HTTPステータスへマッピング
  if (error instanceof NotFoundError) {
    return NextResponse.json(apiErrors.notFound('リソース'), { status: 404 });
  }
  if (error instanceof ConflictError) {
    return NextResponse.json(apiErrors.conflict(error.message), {
      status: 409,
    });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json(apiErrors.forbidden(), { status: 403 });
  }
  if (error instanceof UnauthorizedError) {
    return NextResponse.json(apiErrors.unauthorized(), { status: 401 });
  }

  // HttpError（statusを持つエラー）もサポート（移行期の互換）
  if (isHttpError(error)) {
    const status =
      Number.isInteger(error.status) &&
      error.status >= 400 &&
      error.status <= 599
        ? error.status
        : 500;
    const message =
      typeof error.message === 'string' && error.message.length
        ? error.message
        : 'エラーが発生しました';
    // 本番では details を抑制（露出とシリアライズ失敗の両リスク軽減）
    const details =
      process.env.NODE_ENV === 'development' ? error.details : undefined;
    return NextResponse.json(
      details !== undefined ? { error: message, details } : { error: message },
      { status }
    );
  }

  console.error(`${context} error:`, error);
  return NextResponse.json(apiErrors.internal(), { status: 500 });
}

// ルートやサービス層で使えるシンプルなHttpErrorファクトリ
export interface HttpError extends Error {
  status: number;
  details?: unknown;
}

export const isHttpError = (e: unknown): e is HttpError => {
  return (
    typeof e === 'object' &&
    e !== null &&
    'status' in e &&
    typeof (e as Record<string, unknown>).status === 'number'
  );
};

export function httpError(
  status: number,
  message: string,
  details?: unknown
): HttpError {
  const err = new Error(message) as HttpError;
  err.status = status;
  if (details !== undefined) err.details = details;
  return err;
}
