import { z } from 'zod';

export const baseClientSchema = z.object({
  name: z.string().min(1, '取引先名は必須です'),
  contactName: z.string().optional(),
  contactEmail: z
    .email({ message: 'メールアドレスの形式が不正です' })
    .optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export const createClientSchema = baseClientSchema;

export const updateClientSchema = baseClientSchema.partial();

export type ClientFormData = z.infer<typeof createClientSchema>;
export type ClientUpdateData = z.infer<typeof updateClientSchema>;

export const clientSchemas = {
  create: createClientSchema,
  update: updateClientSchema,
};
