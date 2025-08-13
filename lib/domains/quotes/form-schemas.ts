import { z } from 'zod';

// UI用フォームスキーマ（RHFのフィールド型と一致させるためにcoerceを使わない）
export const quoteFormUiSchema = z.object({
  clientId: z.string().min(1, 'クライアントIDは必須です'),
  issueDate: z.date(),
  expiryDate: z.date().optional(),
  notes: z.string().optional(),
});
