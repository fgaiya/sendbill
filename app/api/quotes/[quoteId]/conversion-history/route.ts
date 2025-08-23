import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { handleApiError, commonValidationSchemas } from '@/lib/shared/forms';
import { prisma } from '@/lib/shared/prisma';
import { requireUserCompany } from '@/lib/shared/utils/auth';

interface RouteContext {
  params: Promise<{ quoteId: string }>;
}

const quoteParamsSchema = z.object({
  quoteId: commonValidationSchemas.cuid('quoteID'),
});

/**
 * 見積書の変換履歴取得API
 * 指定した見積書の請求書変換履歴を取得します
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { quoteId } = quoteParamsSchema.parse(await context.params);
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    // 見積書の存在確認
    const quote = await prisma.quote.findFirst({
      where: {
        id: quoteId,
        companyId: company.id,
        deletedAt: null,
      },
    });

    if (!quote) {
      return NextResponse.json(
        { error: '見積書が見つかりません' },
        { status: 404 }
      );
    }

    // 変換履歴を取得
    const conversionLogs = await prisma.conversionLog.findMany({
      where: {
        quoteId: quoteId,
        companyId: company.id,
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            issueDate: true,
            status: true,
          },
        },
      },
      orderBy: {
        conversionDate: 'desc',
      },
    });

    return NextResponse.json({
      data: conversionLogs.map((log) => ({
        id: log.id,
        conversionDate: log.conversionDate,
        userId: log.userId,
        invoice: log.invoice,
        duplicatedItemsCount: log.selectedItemIds?.length ?? 0,
        issueDate: log.issueDate,
        dueDate: log.dueDate,
        notes: log.notes,
        errorMessage: log.errorMessage,
      })),
    });
  } catch (error) {
    return handleApiError(error, 'Quote conversion history fetch');
  }
}
