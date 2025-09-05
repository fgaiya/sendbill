import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { checkAndConsume } from '@/lib/domains/billing/metering';
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

    // 帳票作成としてカウント
    const guard = await checkAndConsume(company!.id, 'DOCUMENT_CREATE', 1);
    if (!guard.allowed) {
      return NextResponse.json(
        {
          error: 'usage_limit_exceeded',
          code: guard.blockedReason,
          usage: guard.usage,
          upgradeUrl: '/api/billing/checkout',
        },
        { status: 402 }
      );
    }

    const duplicated = await duplicateQuote(company!.id, quoteId);
    const publicQuote = convertPrismaQuoteToQuote(duplicated);

    const headers: Record<string, string> = {};
    if (guard.usage) {
      headers['X-Usage-Used'] = String(guard.usage.used);
      headers['X-Usage-Remaining'] = String(guard.usage.remaining);
      headers['X-Usage-Limit'] = String(guard.usage.limit);
      if (guard.warn) headers['X-Usage-Warn'] = 'true';
    }

    return NextResponse.json(
      { data: publicQuote, message: '見積書を複製しました' },
      {
        status: 201,
        headers: { Location: `/api/quotes/${publicQuote.id}`, ...headers },
      }
    );
  } catch (error) {
    return handleApiError(error, 'Quote duplicate');
  }
}
