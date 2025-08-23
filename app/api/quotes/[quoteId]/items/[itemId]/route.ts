import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import {
  quoteItemSchemas,
  patchQuoteItemSchema,
} from '@/lib/domains/quotes/schemas';
import {
  updateQuoteItem,
  deleteQuoteItem,
  getQuoteItem,
} from '@/lib/domains/quotes/service';
import { convertPrismaQuoteItemToQuoteItem } from '@/lib/domains/quotes/types';
import {
  apiErrors,
  handleApiError,
  commonValidationSchemas,
} from '@/lib/shared/forms';
import { requireUserCompany } from '@/lib/shared/utils/auth';

interface RouteContext {
  params: Promise<{ quoteId: string; itemId: string }>;
}

const quoteItemParamsSchema = z.object({
  quoteId: commonValidationSchemas.cuid('quoteID'),
  itemId: commonValidationSchemas.cuid('itemID'),
});

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { quoteId, itemId } = quoteItemParamsSchema.parse(
      await context.params
    );
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    const item = await getQuoteItem(itemId, quoteId, company.id);

    if (!item) {
      return NextResponse.json(apiErrors.notFound('品目'), { status: 404 });
    }

    return NextResponse.json({
      data: convertPrismaQuoteItemToQuoteItem(item),
    });
  } catch (error) {
    return handleApiError(error, 'Quote item fetch');
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { quoteId, itemId } = quoteItemParamsSchema.parse(
      await context.params
    );
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    const body = await request.json();
    const validatedData = quoteItemSchemas.update.parse(body);

    const item = await updateQuoteItem(
      itemId,
      quoteId,
      company.id,
      validatedData
    );

    return NextResponse.json({
      data: convertPrismaQuoteItemToQuoteItem(item),
      message: '品目を更新しました',
    });
  } catch (error) {
    return handleApiError(error, 'Quote item update');
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { quoteId, itemId } = quoteItemParamsSchema.parse(
      await context.params
    );
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    const body = await request.json();
    // 部分更新（並び順は除外）
    const validatedData = patchQuoteItemSchema.parse(body);

    const item = await updateQuoteItem(
      itemId,
      quoteId,
      company.id,
      validatedData
    );

    return NextResponse.json({
      data: convertPrismaQuoteItemToQuoteItem(item),
      message: '品目を部分更新しました',
    });
  } catch (error) {
    return handleApiError(error, 'Quote item partial update');
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { quoteId, itemId } = quoteItemParamsSchema.parse(
      await context.params
    );
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    await deleteQuoteItem(itemId, quoteId, company.id);

    return NextResponse.json(
      { message: '品目を削除しました' },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, 'Quote item delete');
  }
}
