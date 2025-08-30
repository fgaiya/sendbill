import { NextRequest, NextResponse } from 'next/server';

import { clientSchemas } from '@/lib/domains/clients/schemas';
import {
  includeSchema,
  buildIncludeRelations,
} from '@/lib/domains/clients/utils';
import { apiErrors, handleApiError } from '@/lib/shared/forms';
import { getPrisma } from '@/lib/shared/prisma';
import { requireResourceAccess } from '@/lib/shared/utils/auth';
import { updateResource } from '@/lib/shared/utils/crud';

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
      await getPrisma().client.findUnique({
        where: { id },
        include: includeRelations,
      }),
      '取引先'
    );
    if (error) {
      return NextResponse.json(error, { status });
    }

    // 削除済みの取引先は404を返す
    if (client.deletedAt) {
      return NextResponse.json(apiErrors.notFound('取引先'), { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    return handleApiError(error, 'Client fetch');
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  return updateResource(id, request, {
    model: getPrisma().client,
    schemas: clientSchemas,
    resourceName: '取引先',
  });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const {
      error,
      status,
      resource: client,
    } = await requireResourceAccess(
      await getPrisma().client.findUnique({ where: { id } }),
      '取引先'
    );
    if (error) {
      return NextResponse.json(error, { status });
    }

    if (client?.deletedAt) {
      return NextResponse.json(
        { message: '既に削除済みです' },
        { status: 200 }
      );
    }

    await getPrisma().client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json(
      { message: '取引先を削除しました' },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, 'Client soft delete');
  }
}
