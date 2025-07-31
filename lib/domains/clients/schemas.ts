import { Prisma } from '@prisma/client';
import { z } from 'zod';

import { commonValidationSchemas } from '@/lib/shared/forms';

/**
 * 取引先ドメインバリデーションスキーマ
 */

const baseClientFields = {
  name: commonValidationSchemas.requiredString('取引先名'),
  contactName: z.string().optional(),
  contactEmail: commonValidationSchemas.optionalEmail,
  address: z.string().optional(),
  phone: commonValidationSchemas.phoneNumber,
};

// 顧客フォーム用の型（userId等は除外）
type ClientFormInput = Omit<
  Prisma.ClientUncheckedCreateInput,
  'id' | 'createdAt' | 'updatedAt' | 'userId'
>;

export const clientSchemas = {
  create: z.object(baseClientFields) satisfies z.ZodType<ClientFormInput>,
  update: z.object({
    ...baseClientFields,
    name: z.string().min(1, '取引先名を空にすることはできません').optional(),
  }) satisfies z.ZodType<Partial<ClientFormInput>>,
};
