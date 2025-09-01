import { NextRequest, NextResponse } from 'next/server';

import { clientSchemas } from '@/lib/domains/clients/schemas';
import {
  paginationSchema,
  clientSearchSchema,
  buildIncludeRelations,
  buildClientSearchWhere,
  buildOrderBy,
} from '@/lib/domains/clients/utils';
import { apiErrors } from '@/lib/shared/forms';
import { getPrisma } from '@/lib/shared/prisma';
import { requireUserCompany } from '@/lib/shared/utils/auth';
import { createResourceWithAutoUser } from '@/lib/shared/utils/crud';

export async function POST(request: NextRequest) {
  return createResourceWithAutoUser(request, {
    model: getPrisma().client,
    schemas: clientSchemas,
    resourceName: '取引先',
  });
}

export async function GET(request: NextRequest) {
  try {
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
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
    const where = buildClientSearchWhere(company.id, q || undefined);
    const orderBy = buildOrderBy(sort);
    const includeRelations = buildIncludeRelations(include);

    // データ取得とカウント（並列実行）
    const [clients, total] = await Promise.all([
      getPrisma().client.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: includeRelations,
      }),
      getPrisma().client.count({ where }),
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
