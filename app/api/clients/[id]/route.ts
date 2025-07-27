import { NextRequest, NextResponse } from 'next/server';

import { clientSchemas } from '@/lib/domains/clients/schemas';
import {
  includeSchema,
  buildIncludeRelations,
} from '@/lib/domains/clients/utils';
import { apiErrors, handleApiError } from '@/lib/shared/forms';
import { prisma } from '@/lib/shared/prisma';
import { requireResourceAccess } from '@/lib/shared/utils/auth';
import { updateResource, deleteResource } from '@/lib/shared/utils/crud';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);

    // includeパラメータの解析
    const includeResult = includeSchema.safeParse({
      include: searchParams.get('include'),
    });

    if (!includeResult.success) {
      return NextResponse.json(
        apiErrors.validation(includeResult.error.issues),
        { status: 400 }
      );
    }

    const { include } = includeResult.data;

    // 関連データ取得設定
    const includeRelations = buildIncludeRelations(include);

    const {
      error,
      status,
      resource: client,
    } = await requireResourceAccess(
      await prisma.client.findUnique({
        where: { id },
        include: includeRelations,
      }),
      '取引先'
    );
    if (error) {
      return NextResponse.json(error, { status });
    }

    return NextResponse.json(client);
  } catch (error) {
    return handleApiError(error, 'Client fetch');
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  return updateResource(id, request, {
    model: prisma.client,
    schemas: clientSchemas,
    resourceName: '取引先',
  });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  // 関連データチェックのカスタムバリデーション
  const validateClientDeletion = async () => {
    const [invoiceCount, quoteCount] = await Promise.all([
      prisma.invoice.count({ where: { clientId: id } }),
      prisma.quote.count({ where: { clientId: id } }),
    ]);

    if (invoiceCount > 0 || quoteCount > 0) {
      return NextResponse.json(
        apiErrors.conflict(
          '関連する請求書または見積書が存在するため削除できません'
        ),
        { status: 409 }
      );
    }

    return null; // バリデーション成功
  };

  return deleteResource(
    id,
    {
      model: prisma.client,
      resourceName: '取引先',
    },
    validateClientDeletion
  );
}
