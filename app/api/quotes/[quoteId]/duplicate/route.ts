import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { logUsage } from '@/lib/domains/billing/logger';
import { checkAndConsume, peekUsage } from '@/lib/domains/billing/metering';
import { duplicateQuote } from '@/lib/domains/quotes/service';
import { convertPrismaQuoteToQuote } from '@/lib/domains/quotes/types';
import { handleApiError, commonValidationSchemas } from '@/lib/shared/forms';
import { getPrisma } from '@/lib/shared/prisma';
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

    // 事前確認（非原子的）
    {
      const pre = await peekUsage(company!.id, 'DOCUMENT_CREATE');
      if (!pre.allowed) {
        const plan: 'FREE' | 'PRO' = company!.plan === 'PRO' ? 'PRO' : 'FREE';
        logUsage(company!.id, 'DOCUMENT_CREATE', plan, pre, 'block');
        const errHeaders: Record<string, string> = {};
        if (pre.usage) {
          errHeaders['X-Usage-Used'] = String(pre.usage.used);
          errHeaders['X-Usage-Remaining'] = String(pre.usage.remaining);
          errHeaders['X-Usage-Limit'] = String(pre.usage.limit);
          if (pre.warn) errHeaders['X-Usage-Warn'] = 'true';
        }
        return NextResponse.json(
          {
            error: 'usage_limit_exceeded',
            code: pre.blockedReason,
            usage: pre.usage,
            upgradeUrl: '/api/billing/checkout',
          },
          { status: 402, headers: errHeaders }
        );
      }
    }

    const duplicated = await duplicateQuote(company!.id, quoteId);
    const publicQuote = convertPrismaQuoteToQuote(duplicated);

    // 成功後に消費（CAS）。競合で失敗した場合は補償削除
    const guard = await checkAndConsume(company!.id, 'DOCUMENT_CREATE', 1);
    if (!guard.allowed) {
      try {
        await getPrisma().quote.delete({ where: { id: publicQuote.id } });
      } catch {}
      const plan: 'FREE' | 'PRO' = company!.plan === 'PRO' ? 'PRO' : 'FREE';
      logUsage(company!.id, 'DOCUMENT_CREATE', plan, guard, 'block');
      const errHeaders: Record<string, string> = {};
      if (guard.usage) {
        errHeaders['X-Usage-Used'] = String(guard.usage.used);
        errHeaders['X-Usage-Remaining'] = String(guard.usage.remaining);
        errHeaders['X-Usage-Limit'] = String(guard.usage.limit);
        if (guard.warn) errHeaders['X-Usage-Warn'] = 'true';
      }
      return NextResponse.json(
        {
          error: 'usage_limit_exceeded',
          code: guard.blockedReason,
          usage: guard.usage,
          upgradeUrl: '/api/billing/checkout',
        },
        { status: 402, headers: errHeaders }
      );
    }

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
