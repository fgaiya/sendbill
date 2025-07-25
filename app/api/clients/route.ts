import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

import { clientSchemas } from '@/lib/domains/clients/schemas';
import {
  paginationSchema,
  clientSearchSchema,
  buildIncludeRelations,
  buildClientSearchWhere,
  buildOrderBy,
} from '@/lib/domains/clients/utils';
import { apiErrors } from '@/lib/shared/forms';
import { prisma } from '@/lib/shared/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(apiErrors.unauthorized(), { status: 401 });
    }

    const body = await request.json();
    const validatedData = clientSchemas.create.parse(body);

    const client = await prisma.client.create({
      data: {
        ...validatedData,
        userId,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(apiErrors.validation(error.issues), {
        status: 400,
      });
    }

    console.error('Client creation error:', error);
    return NextResponse.json(apiErrors.internal(), { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(apiErrors.unauthorized(), { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // パラメータの解析とバリデーション
    const paginationResult = paginationSchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });

    const searchResult = clientSearchSchema.safeParse({
      q: searchParams.get('q'),
      sort: searchParams.get('sort'),
      include: searchParams.get('include'),
    });

    if (!paginationResult.success || !searchResult.success) {
      return NextResponse.json(
        apiErrors.validation([
          ...(paginationResult.error?.issues || []),
          ...(searchResult.error?.issues || []),
        ]),
        { status: 400 }
      );
    }

    const { page, limit } = paginationResult.data;
    const { q, sort, include } = searchResult.data;

    // 検索条件とソート条件、関連データ取得設定の構築
    const where = buildClientSearchWhere(userId, q);
    const orderBy = buildOrderBy(sort);
    const includeRelations = buildIncludeRelations(include);

    // データ取得とカウント（並列実行）
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: includeRelations,
      }),
      prisma.client.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: clients,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Clients fetch error:', error);
    return NextResponse.json(apiErrors.internal(), { status: 500 });
  }
}
