import { NextRequest } from 'next/server';

import { companySchemas } from '@/lib/shared/forms';
import { prisma } from '@/lib/shared/prisma';
import { updateResource, deleteResource } from '@/lib/shared/utils/crud';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  return updateResource(id, request, {
    model: prisma.company,
    schemas: companySchemas,
    resourceName: '会社情報',
  });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  return deleteResource(id, {
    model: prisma.company,
    resourceName: '会社情報',
  });
}
