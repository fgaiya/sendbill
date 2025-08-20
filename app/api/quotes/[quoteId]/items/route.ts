import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import {
  quoteItemSchemas,
  reorderQuoteItemsSchema,
} from '@/lib/domains/quotes/schemas';
import {
  getQuoteItems,
  createQuoteItem,
  replaceAllQuoteItems,
  reorderQuoteItems,
} from '@/lib/domains/quotes/service';
import { convertPrismaQuoteItemToQuoteItem } from '@/lib/domains/quotes/types';
import { handleApiError } from '@/lib/shared/forms';
import { requireUserCompany } from '@/lib/shared/utils/auth';

interface RouteContext {
  params: Promise<{ quoteId: string }>;
}

const quoteParamsSchema = z.object({
  quoteId: z.string().min(1, 'quoteIdは必須です'),
});

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { quoteId } = quoteParamsSchema.parse(await context.params);
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    const items = await getQuoteItems(quoteId, company.id);
    return NextResponse.json({
      data: items.map(convertPrismaQuoteItemToQuoteItem),
    });
  } catch (error) {
    return handleApiError(error, 'Quote items fetch');
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { quoteId } = quoteParamsSchema.parse(await context.params);
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    const body = await request.json();
    const validatedData = quoteItemSchemas.create.parse(body);

    const item = await createQuoteItem(quoteId, company.id, validatedData);
    const publicItem = convertPrismaQuoteItemToQuoteItem(item);

    return NextResponse.json(
      {
        data: publicItem,
        message: '品目を作成しました',
      },
      {
        status: 201,
        headers: { Location: `/api/quotes/${quoteId}/items/${publicItem.id}` },
      }
    );
  } catch (error) {
    return handleApiError(error, 'Quote item creation');
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
    const validatedData = quoteItemSchemas.replace.parse(body);

    const items = await replaceAllQuoteItems(
      quoteId,
      company.id,
      validatedData.items
    );
    return NextResponse.json({
      data: items.map(convertPrismaQuoteItemToQuoteItem),
      message: '品目を更新しました',
    });
  } catch (error) {
    return handleApiError(error, 'Quote items replacement');
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { quoteId } = quoteParamsSchema.parse(await context.params);
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    // 並び順の部分更新（create/deleteは不可）
    const body = await request.json();
    const validatedData = reorderQuoteItemsSchema.parse(body);

    const items = await reorderQuoteItems(quoteId, company.id, validatedData);
    return NextResponse.json({
      data: items.map(convertPrismaQuoteItemToQuoteItem),
      message: '品目の順序を更新しました',
    });
  } catch (error) {
    return handleApiError(error, 'Quote items batch update');
  }
}
