import { z } from 'zod';

// 時刻を無視して「日付のみ」で比較するための正規化
const normalizeDate = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

// UI用フォームスキーマ（RHFのフィールド型と一致させるためにcoerceを使わない）
export const quoteFormUiSchema = z
  .object({
    // 取引先IDは空白しかない値を拒否
    clientId: z.string().trim().min(1, '取引先は必須項目です'),
    issueDate: z.date(),
    expiryDate: z.date().optional(),
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
