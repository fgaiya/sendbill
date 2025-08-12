import { NextRequest, NextResponse } from 'next/server';

import {
  dedicatedSearchSchema,
  buildIncludeRelations,
  buildClientSearchWhere,
} from '@/lib/domains/clients/utils';
import { apiErrors, handleApiError } from '@/lib/shared/forms';
import { prisma } from '@/lib/shared/prisma';
import { requireUserCompany } from '@/lib/shared/utils/auth';

export async function GET(request: NextRequest) {
  try {
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    const { searchParams } = new URL(request.url);

    const searchResult = dedicatedSearchSchema.safeParse({
      q: searchParams.get('q'),
      limit: searchParams.get('limit'),
      include: searchParams.get('include'),
    });

    if (!searchResult.success) {
      return NextResponse.json(
        apiErrors.validation(searchResult.error.issues),
        { status: 400 }
      );
    }

    const { q, limit, include } = searchResult.data;

    // 検索条件と関連データ取得設定の構築
    const where = buildClientSearchWhere(company.id, q);
    const includeRelations = buildIncludeRelations(include);

    // 検索実行（名前順でソート）とカウント（並列実行）
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { name: 'asc' },
        take: limit,
        include: includeRelations,
      }),
      prisma.client.count({ where }),
    ]);

    return NextResponse.json({
      data: clients,
      pagination: {
        total,
        page: 1, // 検索APIではページング概念がないため固定
        limit,
        totalPages: Math.ceil(total / limit),
      },
      query: q, // 検索キーワードは追加情報として保持
    });
  } catch (error) {
    return handleApiError(error, 'Client search');
  }
}
