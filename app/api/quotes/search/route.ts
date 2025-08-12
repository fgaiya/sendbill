import { NextRequest, NextResponse } from 'next/server';

import { quoteSearchSchema } from '@/lib/domains/quotes/schemas';
import { getQuotes } from '@/lib/domains/quotes/service';
import { convertPrismaQuoteToQuote } from '@/lib/domains/quotes/types';
import {
  buildIncludeRelations,
  buildQuoteSearchWhere,
  buildOrderBy,
} from '@/lib/domains/quotes/utils';
import { apiErrors, handleApiError } from '@/lib/shared/forms';
import { requireUserCompany } from '@/lib/shared/utils/auth';

export async function GET(request: NextRequest) {
  try {
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    const { searchParams } = new URL(request.url);

    // 検索パラメータの解析とバリデーション
    const searchResult = quoteSearchSchema.safeParse({
      q: searchParams.get('q'),
      status: searchParams.get('status'),
      clientId: searchParams.get('clientId'),
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
      sort: searchParams.get('sort'),
      include: searchParams.get('include'),
    });

    if (!searchResult.success) {
      return NextResponse.json(
        apiErrors.validation(searchResult.error.issues),
        { status: 400 }
      );
    }

    const {
      q,
      status: quoteStatus,
      clientId,
      dateFrom,
      dateTo,
      sort,
      include,
    } = searchResult.data;

    // 検索条件とソート条件、関連データ取得設定の構築
    const where = buildQuoteSearchWhere(company.id, {
      query: q,
      status: quoteStatus,
      clientId,
      dateFrom,
      dateTo,
    });
    const orderBy = buildOrderBy(sort);
    const includeRelations = buildIncludeRelations(include);

    // データ取得（検索API用に制限あり）
    const rawLimit = searchParams.get('limit');
    const parsed = rawLimit ? Number.parseInt(rawLimit, 10) : 10;
    const limit = Math.max(
      1,
      Math.min(Number.isFinite(parsed) ? parsed : 10, 50)
    );
    const { quotes, total } = await getQuotes(
      company.id,
      where,
      orderBy,
      includeRelations,
      {
        skip: 0,
        take: limit,
      }
    );

    return NextResponse.json({
      data: quotes.map(convertPrismaQuoteToQuote),
      total,
      limit,
    });
  } catch (error) {
    return handleApiError(error, 'Quotes search');
  }
}
