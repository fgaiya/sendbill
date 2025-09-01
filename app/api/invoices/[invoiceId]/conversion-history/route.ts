import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { handleApiError, commonValidationSchemas } from '@/lib/shared/forms';
import { getPrisma } from '@/lib/shared/prisma';
import { requireUserCompany } from '@/lib/shared/utils/auth';

interface RouteContext {
  params: Promise<{ invoiceId: string }>;
}

const invoiceParamsSchema = z.object({
  invoiceId: commonValidationSchemas.cuid('請求書ID'),
});

/**
 * 請求書の変換履歴取得API
 * 指定した請求書の元見積書情報を取得します
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { invoiceId } = invoiceParamsSchema.parse(await context.params);
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    // 請求書の存在確認
    const invoice = await getPrisma().invoice.findFirst({
      where: {
        id: invoiceId,
        companyId: company.id,
        deletedAt: null,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: '請求書が見つかりません' },
        { status: 404 }
      );
    }

    // 変換履歴を取得
    const conversionLog = await getPrisma().conversionLog.findUnique({
      where: {
        invoiceId_companyId: {
          invoiceId: invoiceId,
          companyId: company.id,
        },
      },
      include: {
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            issueDate: true,
            status: true,
          },
        },
      },
    });

    if (!conversionLog) {
      return NextResponse.json({
        data: null,
        message: 'この請求書は見積書から作成されていません',
      });
    }

    return NextResponse.json({
      data: {
        id: conversionLog.id,
        conversionDate: conversionLog.conversionDate,
        userId: conversionLog.userId,
        quote: conversionLog.quote,
        duplicatedItemsCount: conversionLog.selectedItemIds?.length ?? 0,
        issueDate: conversionLog.issueDate,
        dueDate: conversionLog.dueDate,
        notes: conversionLog.notes,
        quoteSnapshot: conversionLog.quoteSnapshot,
      },
    });
  } catch (error) {
    return handleApiError(error, 'Invoice conversion history fetch');
  }
}
