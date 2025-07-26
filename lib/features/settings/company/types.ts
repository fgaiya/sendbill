import { z } from 'zod';

import { companySchemas } from '@/lib/shared/forms';

export type CompanyFormData = z.infer<typeof companySchemas.create>;

export interface Company extends CompanyFormData {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
