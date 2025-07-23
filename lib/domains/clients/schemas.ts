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

export const clientSchemas = {
  create: z.object(baseClientFields),
  update: z.object({
    ...baseClientFields,
    name: z.string().min(1, '取引先名は必須です').optional(),
  }),
};
