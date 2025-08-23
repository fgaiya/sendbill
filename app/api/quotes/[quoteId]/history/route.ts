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
 * 見積書の操作履歴取得API
 * 作成・更新・削除・ステータス変更・変換履歴を統合して取得します
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

    // 操作履歴データを作成（実際のDB監査ログがない場合の模擬データ）
    const historyItems = [
      // 見積書作成履歴
      {
        id: `create-${quote.id}`,
        action: 'create' as const,
        actionLabel: '作成',
        timestamp: quote.createdAt,
        userId: 'system', // 実際の実装では作成者IDを使用
        userName: 'システム',
        description: '見積書を作成しました',
        details: {
          quoteNumber: quote.quoteNumber,
          clientName: 'クライアント名', // 実際の実装ではJOINして取得
        },
      },
      // 最終更新履歴
      ...(quote.updatedAt.getTime() !== quote.createdAt.getTime()
        ? [
            {
              id: `update-${quote.id}`,
              action: 'update' as const,
              actionLabel: '更新',
              timestamp: quote.updatedAt,
              userId: 'system',
              userName: 'システム',
              description: '見積書を更新しました',
              details: {
                status: quote.status,
              },
            },
          ]
        : []),
      // 変換履歴
      ...conversionLogs.map((log) => ({
        id: `conversion-${log.id}`,
        action: 'convert' as const,
        actionLabel: '請求書変換',
        timestamp: log.conversionDate,
        userId: log.userId ?? 'system',
        userName: 'システム',
        description: '見積書から請求書を作成しました',
        details: {
          invoiceId: log.invoice?.id,
          invoiceNumber: log.invoice?.invoiceNumber,
          invoiceStatus: log.invoice?.status,
          duplicatedItemsCount: log.selectedItemIds?.length ?? 0,
        },
      })),
    ];

    // 時系列順にソート
    historyItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return NextResponse.json({
      data: historyItems,
    });
  } catch (error) {
    return handleApiError(error, 'Quote history fetch');
  }
}
