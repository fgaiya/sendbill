import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { invoiceSchemas } from '@/lib/domains/invoices/schemas';
import { createInvoiceFromQuoteWithHistory } from '@/lib/domains/invoices/service';
import { convertPrismaInvoiceToInvoice } from '@/lib/domains/invoices/types';
import { handleApiError } from '@/lib/shared/forms';
import { requireUserCompany } from '@/lib/shared/utils/auth';

// パラメータスキーマ
const quoteParamsSchema = z.object({
  quoteId: z.string().min(1, '見積書IDは必須です'),
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

    // 見積書から請求書を作成（履歴記録付き）
    const result = await createInvoiceFromQuoteWithHistory(
      company.id,
      quoteId,
      user!.id,
      validatedData
    );

    const publicInvoice = convertPrismaInvoiceToInvoice(result.invoice);

    return NextResponse.json(
      {
        data: publicInvoice,
        duplicatedItemsCount: result.duplicatedItemsCount,
        totalItemsCount: result.totalItemsCount,
        message: `見積書から請求書を作成しました（${result.duplicatedItemsCount}/${result.totalItemsCount}件の品目を複製）`,
      },
      {
        status: 201,
        headers: { Location: `/api/invoices/${publicInvoice.id}` },
      }
    );
  } catch (error) {
    return handleApiError(error, 'Invoice creation from quote');
  }
}
