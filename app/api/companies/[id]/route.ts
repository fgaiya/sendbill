import { NextRequest, NextResponse } from 'next/server';

import { Prisma } from '@prisma/client/edge';

import { companySchemas, apiErrors, handleApiError } from '@/lib/shared/forms';
import { getPrisma } from '@/lib/shared/prisma';
import { requireAuth } from '@/lib/shared/utils/auth';
import { omitUndefined } from '@/lib/shared/utils/objects';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { user, error, status } = await requireAuth();
    if (error) {
      return NextResponse.json(error, { status });
    }

    // 会社情報を取得・所有権確認
    const existingCompany = await getPrisma().company.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingCompany) {
      return NextResponse.json(apiErrors.notFound('会社情報'), { status: 404 });
    }

    if (existingCompany.userId !== user!.id) {
      return NextResponse.json(apiErrors.forbidden(), { status: 403 });
    }

    const body = await request.json();
    const validatedData = companySchemas.update.parse(body);

    const filteredData = omitUndefined(
      validatedData as Record<string, unknown>
    );

    const updatedCompany = await getPrisma().company.update({
      where: { id },
      data: filteredData,
    });

    return NextResponse.json(updatedCompany);
  } catch (error) {
    return handleApiError(error, '会社情報 update');
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { user, error, status } = await requireAuth();
    if (error) {
      return NextResponse.json(error, { status });
    }

    // 会社情報を取得・所有権確認
    const existingCompany = await getPrisma().company.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      return NextResponse.json(apiErrors.notFound('会社情報'), { status: 404 });
    }

    if (existingCompany.userId !== user!.id) {
      return NextResponse.json(apiErrors.forbidden(), { status: 403 });
    }

    try {
      await getPrisma().company.delete({
        where: { id },
      });
    } catch (e: unknown) {
      // 外部キー制約違反（関連データ存在）をキャッチ
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2003') {
          return NextResponse.json(
            apiErrors.conflict('関連するデータが存在するため削除できません'),
            { status: 409 }
          );
        }
        if (e.code === 'P2025') {
          // 競合で既に消えていた
          return NextResponse.json(apiErrors.notFound('会社情報'), {
            status: 404,
          });
        }
      }
      throw e;
    }

    return NextResponse.json(
      { message: '会社情報を削除しました' },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, '会社情報 delete');
  }
}
