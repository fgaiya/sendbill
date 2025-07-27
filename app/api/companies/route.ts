import { NextRequest } from 'next/server';

import { companySchemas } from '@/lib/shared/forms';
import { prisma } from '@/lib/shared/prisma';
import {
  createResourceWithAutoUser,
  getResourcesWithAutoUser,
} from '@/lib/shared/utils/crud';

export async function POST(request: NextRequest) {
  return createResourceWithAutoUser(request, {
    model: prisma.company,
    schemas: companySchemas,
    resourceName: '会社情報',
    uniqueConstraint: (userId: string) => ({ userId }),
  });
}

export async function GET() {
  return getResourcesWithAutoUser({
    model: prisma.company,
    resourceName: '会社情報',
  });
}
