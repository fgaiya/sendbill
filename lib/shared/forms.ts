import { z } from 'zod';

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
  address: z.string().optional(),
  phone: commonValidationSchemas.phoneNumber,
  contactEmail: commonValidationSchemas.optionalEmail,
  invoiceRegistrationNumber: z.string().optional(),
  representativeName: z.string().optional(),
  bankName: z.string().optional(),
  bankBranch: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountHolder: z.string().optional(),
};

export const companySchemas = {
  create: z.object(baseCompanyFields),
  update: z.object({
    ...baseCompanyFields,
    companyName: z.string().min(1, '会社名は必須です').optional(),
  }),
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
