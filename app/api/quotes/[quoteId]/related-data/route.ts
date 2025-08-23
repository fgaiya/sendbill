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
 * 見積書の関連データ確認API
 * 削除前に依存関係をチェックして削除可否を判定します
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

    // 関連する請求書を確認
    const relatedInvoices = await prisma.invoice.findMany({
      where: {
        quoteId: quoteId,
        companyId: company.id,
        deletedAt: null,
      },
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        issueDate: true,
      },
    });

    // 関連する変換履歴を確認
    const conversionLogs = await prisma.conversionLog.findMany({
      where: {
        quoteId: quoteId,
        companyId: company.id,
      },
      select: {
        id: true,
        conversionDate: true,
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
          },
        },
      },
    });

    // 削除可否の判定
    const hasActiveInvoices = relatedInvoices.some(
      (invoice) => invoice.status === 'SENT' || invoice.status === 'PAID'
    );
    const canDelete = !hasActiveInvoices;

    // 警告メッセージの生成
    const warnings = [];
    if (relatedInvoices.length > 0) {
      warnings.push(
        `この見積書から作成された請求書が${relatedInvoices.length}件あります`
      );
    }
    if (hasActiveInvoices) {
      warnings.push(
        '送信済みまたは支払い済みの請求書があるため、見積書を削除できません'
      );
    }
    if (conversionLogs.length > 0) {
      warnings.push(`変換履歴が${conversionLogs.length}件記録されています`);
    }

    return NextResponse.json({
      data: {
        canDelete,
        relatedData: {
          invoices: relatedInvoices.map((invoice) => ({
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            status: invoice.status,
            statusLabel:
              invoice.status === 'DRAFT'
                ? '下書き'
                : invoice.status === 'SENT'
                  ? '送信済み'
                  : invoice.status === 'PAID'
                    ? '支払い済み'
                    : 'その他',
            issueDate: invoice.issueDate,
          })),
          conversionLogs: conversionLogs.map((log) => ({
            id: log.id,
            conversionDate: log.conversionDate,
            invoiceId: log.invoice?.id,
            invoiceNumber: log.invoice?.invoiceNumber,
            invoiceStatus: log.invoice?.status,
          })),
        },
        warnings,
        blockers: hasActiveInvoices
          ? ['送信済みまたは支払い済みの請求書が存在します']
          : [],
      },
    });
  } catch (error) {
    return handleApiError(error, 'Quote related data check');
  }
}
