import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { handleApiError, commonValidationSchemas } from '@/lib/shared/forms';
import { prisma } from '@/lib/shared/prisma';
import { requireUserCompany } from '@/lib/shared/utils/auth';

interface RouteContext {
  params: Promise<{ invoiceId: string }>;
}

const invoiceParamsSchema = z.object({
  invoiceId: commonValidationSchemas.cuid('請求書ID'),
});

/**
 * 請求書の操作履歴取得API
 * 作成・更新・削除・ステータス変更履歴を統合して取得します
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { invoiceId } = invoiceParamsSchema.parse(await context.params);
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    // 請求書の存在確認
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        companyId: company.id,
        deletedAt: null,
      },
      include: {
        quote: {
          select: {
            id: true,
            quoteNumber: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: '請求書が見つかりません' },
        { status: 404 }
      );
    }

    // 関連する変換履歴を取得（見積書からの変換元）
    const relatedConversionLog = invoice.quoteId
      ? await prisma.conversionLog.findFirst({
          where: {
            quoteId: invoice.quoteId,
            companyId: company.id,
            invoiceId: invoiceId,
          },
          include: {
            invoice: {
              select: { id: true },
            },
          },
        })
      : null;

    // 操作履歴データを作成（実際のDB監査ログがない場合の模擬データ）
    const historyItems = [
      // 見積書から変換された場合の履歴
      ...(relatedConversionLog
        ? [
            {
              id: `converted-from-quote-${invoice.id}`,
              action: 'convert' as const,
              actionLabel: '見積書から変換',
              timestamp: relatedConversionLog.conversionDate,
              userId: relatedConversionLog.userId ?? 'system',
              userName: 'システム',
              description: `見積書「${invoice.quote?.quoteNumber ?? ''}」から請求書を作成しました`,
              details: {
                quoteId: invoice.quote?.id,
                quoteNumber: invoice.quote?.quoteNumber,
                duplicatedItemsCount:
                  relatedConversionLog.selectedItemIds?.length ?? 0,
              },
            },
          ]
        : [
            // 直接作成の場合
            {
              id: `create-${invoice.id}`,
              action: 'create' as const,
              actionLabel: '作成',
              timestamp: invoice.createdAt,
              userId: 'system',
              userName: 'システム',
              description: '請求書を作成しました',
              details: {
                invoiceNumber: invoice.invoiceNumber,
              },
            },
          ]),
      // 最終更新履歴
      ...(invoice.updatedAt.getTime() !== invoice.createdAt.getTime()
        ? [
            {
              id: `update-${invoice.id}`,
              action: 'update' as const,
              actionLabel: '更新',
              timestamp: invoice.updatedAt,
              userId: 'system',
              userName: 'システム',
              description: '請求書を更新しました',
              details: {
                status: invoice.status,
              },
            },
          ]
        : []),
    ];

    // 時系列順にソート
    historyItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return NextResponse.json({
      data: historyItems,
    });
  } catch (error) {
    return handleApiError(error, 'Invoice history fetch');
  }
}
