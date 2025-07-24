import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

import { clientSchemas } from '@/lib/domains/clients/schemas';
import {
  includeSchema,
  buildIncludeRelations,
} from '@/lib/domains/clients/utils';
import { apiErrors } from '@/lib/shared/forms';
import { prisma } from '@/lib/shared/prisma';
import { checkResourceOwnership } from '@/lib/shared/utils/auth';
import { omitUndefined } from '@/lib/shared/utils/objects';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(apiErrors.unauthorized(), { status: 401 });
    }

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

    const client = await prisma.client.findUnique({
      where: { id },
      include: includeRelations,
    });

    const ownershipError = checkResourceOwnership(client, userId, '取引先');
    if (ownershipError) {
      return ownershipError;
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Client fetch error:', error);
    return NextResponse.json(apiErrors.internal(), { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(apiErrors.unauthorized(), { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const validatedData = clientSchemas.update.parse(body);

    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    const ownershipError = checkResourceOwnership(
      existingClient,
      userId,
      '取引先'
    );
    if (ownershipError) {
      return ownershipError;
    }

    // undefinedの値を除外してPrismaに渡す
    const filteredData = omitUndefined(validatedData);

    const updatedClient = await prisma.client.update({
      where: { id },
      data: filteredData,
    });

    return NextResponse.json(updatedClient);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(apiErrors.validation(error.issues), {
        status: 400,
      });
    }

    console.error('Client update error:', error);
    return NextResponse.json(apiErrors.internal(), { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(apiErrors.unauthorized(), { status: 401 });
    }

    const { id } = await context.params;

    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    const ownershipError = checkResourceOwnership(
      existingClient,
      userId,
      '取引先'
    );
    if (ownershipError) {
      return ownershipError;
    }

    // 関連データの存在チェック（削除前に確認）
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

    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: '取引先を削除しました' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Client delete error:', error);
    return NextResponse.json(apiErrors.internal(), { status: 500 });
  }
}
