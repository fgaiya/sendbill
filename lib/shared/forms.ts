import { z } from 'zod'

/**
 * フォーム管理の共通バリデーションスキーマ
 */

// 共通バリデーションスキーマ
export const commonValidationSchemas = {
  // 必須文字列（空文字不可）
  requiredString: (fieldName: string) => 
    z.string()
      .min(1, `${fieldName}は必須項目です`)
      .trim(),

  // メールアドレス
  email: z.string()
    .min(1, 'メールアドレスは必須項目です')
    .email('有効なメールアドレスを入力してください'),

  // 電話番号（日本の形式）
  phoneNumber: z.string()
    .optional()
    .refine((val) => !val || val === '' || /^0\d{1,4}-\d{1,4}-\d{4}$|^0\d{9,10}$/.test(val), 
      '有効な電話番号を入力してください'),

  // 郵便番号（日本の形式）
  postalCode: z.string()
    .optional()
    .refine((val) => !val || val === '' || /^\d{3}-\d{4}$/.test(val), 
      '郵便番号は000-0000の形式で入力してください'),

  // 金額（正の数）
  amount: z.number()
    .positive('金額は0より大きい値を入力してください')
    .max(999999999, '金額が上限を超えています'),

  // 日付
  date: z.date({
    message: '有効な日付を入力してください',
  }),

  // URL
  url: z.string()
    .optional()
    .refine((val) => !val || val === '' || z.string().url().safeParse(val).success, 
      '有効なURLを入力してください'),
}