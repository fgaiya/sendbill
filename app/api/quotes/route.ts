import { NextRequest, NextResponse } from 'next/server';

import {
  quoteSchemas,
  paginationSchema,
  quoteSearchSchema,
} from '@/lib/domains/quotes/schemas';
import { createQuote, getQuotes } from '@/lib/domains/quotes/service';
import { convertPrismaQuoteToQuote } from '@/lib/domains/quotes/types';
import {
  buildIncludeRelations,
  buildQuoteSearchWhere,
  buildOrderBy,
} from '@/lib/domains/quotes/utils';
import { apiErrors, handleApiError } from '@/lib/shared/forms';
import { requireUserCompany } from '@/lib/shared/utils/auth';

export async function POST(request: NextRequest) {
  try {
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    const body = await request.json();
    const validatedData = quoteSchemas.create.parse(body);

    const quote = await createQuote(company.id, validatedData);
    const publicQuote = convertPrismaQuoteToQuote(quote);

    return NextResponse.json(
      {
        data: publicQuote,
        message: '見積書を作成しました',
      },
      {
        status: 201,
        headers: { Location: `/api/quotes/${publicQuote.id}` },
      }
    );
  } catch (error) {
    return handleApiError(error, 'Quote creation');
  }
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

    const searchResult = quoteSearchSchema.safeParse({
      q: searchParams.get('q'),
      status: searchParams.get('status'),
      clientId: searchParams.get('clientId'),
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
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
    const MAX_LIMIT = 100; // TODO: 設定から取得できるならそちらを使用
    const take = Math.min(limit, MAX_LIMIT);
    const skip = Math.max(0, (page - 1) * take);
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

    // データ取得とカウント（並列実行）
    const { quotes, total } = await getQuotes(
      company.id,
      where,
      orderBy,
      includeRelations,
      {
        skip,
        take,
      }
    );

    const totalPages = take > 0 ? Math.ceil(total / take) : 0;

    return NextResponse.json({
      data: quotes.map(convertPrismaQuoteToQuote),
      pagination: {
        total,
        page,
        limit: take, // 実際に使用されたlimit値
        totalPages,
      },
    });
  } catch (error) {
    return handleApiError(error, 'Quotes fetch');
  }
}
