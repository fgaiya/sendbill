import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { quoteSchemas, includeSchema } from '@/lib/domains/quotes/schemas';
import {
  getQuote,
  updateQuote,
  deleteQuote,
} from '@/lib/domains/quotes/service';
import { convertPrismaQuoteToQuote } from '@/lib/domains/quotes/types';
import { buildIncludeRelations } from '@/lib/domains/quotes/utils';
import { apiErrors, handleApiError } from '@/lib/shared/forms';
import { requireUserCompany } from '@/lib/shared/utils/auth';

interface RouteContext {
  params: Promise<{ quoteId: string }>;
}

const quoteParamsSchema = z.object({
  quoteId: z.string().min(1, 'quoteIdは必須です'),
});

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { quoteId } = quoteParamsSchema.parse(await context.params);
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

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
    const includeRelations = buildIncludeRelations(include);

    const quote = await getQuote(quoteId, company!.id, includeRelations);

    if (!quote) {
      return NextResponse.json(apiErrors.notFound('見積書'), { status: 404 });
    }

    // 削除済みの見積書は404を返す
    if (quote.deletedAt) {
      return NextResponse.json(apiErrors.notFound('見積書'), { status: 404 });
    }

    return NextResponse.json({
      data: convertPrismaQuoteToQuote(quote),
    });
  } catch (error) {
    return handleApiError(error, 'Quote fetch');
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { quoteId } = quoteParamsSchema.parse(await context.params);
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    const body = await request.json();
    const validatedData = quoteSchemas.update.parse(body);

    const quote = await updateQuote(quoteId, company!.id, validatedData);

    return NextResponse.json({
      data: convertPrismaQuoteToQuote(quote),
      message: '見積書を更新しました',
    });
  } catch (error) {
    return handleApiError(error, 'Quote update');
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { quoteId } = quoteParamsSchema.parse(await context.params);
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    // 見積書の存在確認
    const quote = await getQuote(quoteId, company!.id);

    if (!quote) {
      return NextResponse.json(apiErrors.notFound('見積書'), { status: 404 });
    }

    if (quote.deletedAt) {
      return NextResponse.json(
        { message: '既に削除済みです' },
        { status: 200 }
      );
    }

    await deleteQuote(quoteId, company!.id);

    return NextResponse.json(
      { message: '見積書を削除しました' },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, 'Quote soft delete');
  }
}
