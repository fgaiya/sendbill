import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { checkAndConsume, peekUsage } from '@/lib/domains/billing/metering';
import { invoiceSchemas } from '@/lib/domains/invoices/schemas';
import { createInvoiceFromQuoteWithHistory } from '@/lib/domains/invoices/service';
import { convertPrismaInvoiceToInvoice } from '@/lib/domains/invoices/types';
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
 * 見積書から請求書作成API
 * 指定された見積書から新しい請求書を作成します
 * 品目の選択的複製も対応
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { quoteId } = quoteParamsSchema.parse(await context.params);
    const { company, user, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }
    const body = await request.json();

    // リクエストボディのバリデーション
    const validatedData = invoiceSchemas.createFromQuote.parse(body);

    // 事前確認（非原子的）
    {
      const pre = await peekUsage(company.id, 'DOCUMENT_CREATE');
      if (!pre.allowed) {
        return NextResponse.json(
          {
            error: 'usage_limit_exceeded',
            code: pre.blockedReason,
            usage: pre.usage,
            upgradeUrl: '/api/billing/checkout',
          },
          { status: 402 }
        );
      }
    }

    // 見積書から請求書を作成（履歴記録付き）
    const result = await createInvoiceFromQuoteWithHistory(
      company.id,
      quoteId,
      user!.id,
      validatedData
    );

    const publicInvoice = convertPrismaInvoiceToInvoice(result.invoice);

    // 成功後に消費（CAS）。競合で失敗した場合は補償削除
    const guard = await checkAndConsume(company.id, 'DOCUMENT_CREATE', 1);
    if (!guard.allowed) {
      try {
        await getPrisma().invoice.delete({ where: { id: publicInvoice.id } });
      } catch {}
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

    const headers: Record<string, string> = {};
    if (guard.usage) {
      headers['X-Usage-Used'] = String(guard.usage.used);
      headers['X-Usage-Remaining'] = String(guard.usage.remaining);
      headers['X-Usage-Limit'] = String(guard.usage.limit);
      if (guard.warn) headers['X-Usage-Warn'] = 'true';
    }

    return NextResponse.json(
      {
        data: publicInvoice,
        duplicatedItemsCount: result.duplicatedItemsCount,
        totalItemsCount: result.totalItemsCount,
        message: `見積書から請求書を作成しました（${result.duplicatedItemsCount}/${result.totalItemsCount}件の品目を複製）`,
      },
      {
        status: 201,
        headers: { Location: `/api/invoices/${publicInvoice.id}`, ...headers },
      }
    );
  } catch (error) {
    return handleApiError(error, 'Invoice creation from quote');
  }
}
