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
 * 請求書の関連データ確認API
 * 削除前に依存関係をチェックして削除可否を判定します
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
            status: true,
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

    // 関連する変換履歴を確認
    const conversionLog = invoice.quoteId
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

    // 削除可否の判定
    const isPaid = invoice.status === 'PAID';
    const canDelete = !isPaid; // 支払い済みの請求書は削除不可

    // 警告メッセージの生成
    const warnings: string[] = [];
    if (invoice.quote) {
      warnings.push(
        `見積書「${invoice.quote.quoteNumber}」から作成された請求書です`
      );
    }
    if (isPaid) {
      warnings.push('支払い済みの請求書のため、削除できません');
    }
    if (invoice.status === 'SENT') {
      warnings.push('送信済みの請求書です。削除すると取引先に影響があります');
    }
    if (conversionLog) {
      warnings.push('見積書からの変換履歴が記録されています');
    }

    return NextResponse.json({
      data: {
        canDelete,
        relatedData: {
          quote: invoice.quote
            ? {
                id: invoice.quote.id,
                quoteNumber: invoice.quote.quoteNumber,
                status: invoice.quote.status,
                statusLabel:
                  invoice.quote.status === 'DRAFT'
                    ? '下書き'
                    : invoice.quote.status === 'SENT'
                      ? '送信済み'
                      : invoice.quote.status === 'ACCEPTED'
                        ? '承認済み'
                        : invoice.quote.status === 'DECLINED'
                          ? '却下'
                          : 'その他',
              }
            : null,
          conversionLog: conversionLog
            ? {
                id: conversionLog.id,
                conversionDate: conversionLog.conversionDate,
                duplicatedItemsCount:
                  conversionLog.selectedItemIds?.length ?? 0,
              }
            : null,
        },
        warnings,
        blockers: isPaid ? ['支払い済みの請求書は削除できません'] : [],
      },
    });
  } catch (error) {
    return handleApiError(error, 'Invoice related data check');
  }
}
