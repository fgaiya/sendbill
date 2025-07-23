import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import {
  dedicatedSearchSchema,
  buildIncludeRelations,
  buildClientSearchWhere,
} from '@/lib/domains/clients/utils';
import { apiErrors } from '@/lib/shared/forms';
import { prisma } from '@/lib/shared/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(apiErrors.unauthorized(), { status: 401 });
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
    const where = buildClientSearchWhere(userId, q);
    const includeRelations = buildIncludeRelations(include);

    // 検索実行（名前順でソート）
    const clients = await prisma.client.findMany({
      where,
      orderBy: { name: 'asc' },
      take: limit,
      include: includeRelations,
    });

    return NextResponse.json({
      data: clients,
      query: q,
      count: clients.length,
    });
  } catch (error) {
    console.error('Client search error:', error);
    return NextResponse.json(apiErrors.internal(), { status: 500 });
  }
}
