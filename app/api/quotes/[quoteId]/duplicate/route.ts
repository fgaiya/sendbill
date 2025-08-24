import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { duplicateQuote } from '@/lib/domains/quotes/service';
import { convertPrismaQuoteToQuote } from '@/lib/domains/quotes/types';
import { handleApiError, commonValidationSchemas } from '@/lib/shared/forms';
import { requireUserCompany } from '@/lib/shared/utils/auth';

// パラメータスキーマ
const quoteParamsSchema = z.object({
  quoteId: commonValidationSchemas.cuid('見積書ID'),
});

interface RouteContext {
  params: Promise<{ quoteId: string }>;
}

/**
 * 見積書複製API
 */
export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { quoteId } = quoteParamsSchema.parse(await context.params);
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    const duplicated = await duplicateQuote(company!.id, quoteId);
    const publicQuote = convertPrismaQuoteToQuote(duplicated);

    return NextResponse.json(
      { data: publicQuote, message: '見積書を複製しました' },
      { status: 201, headers: { Location: `/api/quotes/${publicQuote.id}` } }
    );
  } catch (error) {
    return handleApiError(error, 'Quote duplicate');
  }
}
