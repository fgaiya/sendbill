import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { checkAndConsume } from '@/lib/domains/billing/metering';
import { duplicateInvoice } from '@/lib/domains/invoices/service';
import { convertPrismaInvoiceToInvoice } from '@/lib/domains/invoices/types';
import { handleApiError, commonValidationSchemas } from '@/lib/shared/forms';
import { requireUserCompany } from '@/lib/shared/utils/auth';

// パラメータスキーマ
const invoiceParamsSchema = z.object({
  invoiceId: commonValidationSchemas.cuid('請求書ID'),
});

interface RouteContext {
  params: Promise<{ invoiceId: string }>;
}

/**
 * 請求書複製API
 */
export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { invoiceId } = invoiceParamsSchema.parse(await context.params);
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

    const duplicated = await duplicateInvoice(company!.id, invoiceId);
    const publicInvoice = convertPrismaInvoiceToInvoice(duplicated);

    const headers: Record<string, string> = {};
    if (guard.usage) {
      headers['X-Usage-Remaining'] = String(guard.usage.remaining);
      headers['X-Usage-Limit'] = String(
        guard.usage.limit + guard.usage.graceLimit
      );
      if (guard.warn) headers['X-Usage-Warn'] = 'true';
    }

    return NextResponse.json(
      { data: publicInvoice, message: '請求書を複製しました' },
      {
        status: 201,
        headers: { Location: `/api/invoices/${publicInvoice.id}`, ...headers },
      }
    );
  } catch (error) {
    return handleApiError(error, 'Invoice duplicate');
  }
}
