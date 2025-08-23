import { z } from 'zod';

import { commonValidationSchemas } from '@/lib/shared/forms';

import { baseQuoteItemSchema } from './schemas';

// 時刻を無視して「日付のみ」で比較するための正規化
const normalizeDate = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

// UI用フォームスキーマ（RHFのフィールド型と一致させるためにcoerceを使わない）
export const quoteFormUiSchema = z
  .object({
    // 取引先IDは空白しかない値を拒否
    clientId: commonValidationSchemas.cuid('取引先ID'),
    // プレビューで表示される取引先名（オプション）
    clientName: z.string().optional(),
    issueDate: z.date(),
    // expiryDate が正式名称
    expiryDate: z.date().optional(),
    // 見積書のタイトル（オプション、プレビュー用）
    title: z
      .string()
      .max(200, 'タイトルは200文字以内で入力してください')
      .optional(),
    // 見積書の説明（オプション、プレビュー用）
    description: z
      .string()
      .max(1000, '説明は1000文字以内で入力してください')
      .optional(),
    // 備考は空白のみを実質未入力扱い＋過度な長文を制限
    notes: z
      .string()
      .trim()
      .max(2000, '備考は2000文字以内で入力してください')
      .optional(),
  })
  .refine(
    (v) =>
      !v.expiryDate ||
      normalizeDate(v.expiryDate) >= normalizeDate(v.issueDate),
    {
      path: ['expiryDate'],
      message: '有効期限は発行日以降を指定してください',
    }
  );

// useFieldArray用の品目フォームスキーマ（UI最適化）
// 数値入力は string になりがちなため、意図的に coerce を使用して受け入れる
export const quoteItemFormSchema = baseQuoteItemSchema
  .extend({
    description: z.string().min(1, '品目名は必須です'),
    quantity: z.coerce.number().positive('数量は正の数である必要があります'),
    unitPrice: z.coerce.number().nonnegative('単価は0以上である必要があります'),
    discountAmount: z.coerce
      .number()
      .nonnegative('割引額は0以上である必要があります')
      .default(0),
    taxCategory: z.enum(['STANDARD', 'REDUCED', 'EXEMPT', 'NON_TAX']),
    // 空文字列やnullをundefinedに正規化してから数値に変換
    taxRate: z.preprocess(
      (v) => (v === '' || v === null ? undefined : v),
      z.coerce
        .number()
        .min(0, '税率は0以上で指定してください')
        .max(100, '税率は100以下で指定してください')
        .optional()
    ),
    unit: z.string().optional(),
    sku: z.string().optional(),
    sortOrder: z.coerce.number().int().nonnegative(),
    // フォーム表示用の計算結果フィールド（readonly）
    subtotal: z.number().optional(),
  })
  .refine((data) => data.discountAmount <= data.unitPrice * data.quantity, {
    message: '割引額は品目合計金額を超えることはできません',
    path: ['discountAmount'],
  })
  .refine(
    (data) => {
      // 非課税または免税の場合、税率は未入力または0であること
      if (data.taxCategory === 'NON_TAX' || data.taxCategory === 'EXEMPT') {
        return data.taxRate == null || data.taxRate === 0;
      }
      return true;
    },
    {
      message: '非課税または免税の場合、税率は未入力または0にしてください',
      path: ['taxRate'],
    }
  );

// 品目配列を含む見積書フォームスキーマ
export const quoteFormWithItemsSchema = quoteFormUiSchema.extend({
  items: z.array(quoteItemFormSchema),
});

// 型エクスポート
export type QuoteItemFormData = z.infer<typeof quoteItemFormSchema>;
export type QuoteFormWithItemsData = z.infer<typeof quoteFormWithItemsSchema>;
