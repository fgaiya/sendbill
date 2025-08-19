import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import {
  invoiceSchemas,
  includeSchema,
  statusUpdateInvoiceSchema,
} from '@/lib/domains/invoices/schemas';
import {
  getInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  updatePaymentInfo,
} from '@/lib/domains/invoices/service';
import { convertPrismaInvoiceToInvoice } from '@/lib/domains/invoices/types';
import { buildIncludeRelations } from '@/lib/domains/invoices/utils';
import { apiErrors, handleApiError } from '@/lib/shared/forms';
import { requireUserCompany } from '@/lib/shared/utils/auth';

// パラメータスキーマ
const invoiceParamsSchema = z.object({
  id: z.string().min(1, '請求書IDは必須です'),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * 請求書詳細取得API
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: invoiceId } = invoiceParamsSchema.parse(await context.params);
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }
    const { searchParams } = new URL(request.url);

    // includeパラメータの処理
    const includeResult = includeSchema.safeParse({
      include: searchParams.get('include'),
    });

    if (!includeResult.success) {
      return NextResponse.json(
        apiErrors.validation(includeResult.error.issues),
        { status: 400 }
      );
    }

    const includeRelations = buildIncludeRelations(includeResult.data.include);

    // 請求書取得
    const invoice = await getInvoice(invoiceId, company.id, includeRelations);

    if (!invoice) {
      return NextResponse.json(apiErrors.notFound('請求書'), { status: 404 });
    }

    return NextResponse.json({
      data: convertPrismaInvoiceToInvoice(invoice),
    });
  } catch (error) {
    return handleApiError(error, 'Invoice fetch');
  }
}

/**
 * 請求書更新API
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id: invoiceId } = invoiceParamsSchema.parse(await context.params);
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }
    const body = await request.json();

    const validatedData = invoiceSchemas.update.parse(body);

    const updatedInvoice = await updateInvoice(
      invoiceId,
      company.id,
      validatedData
    );
    const publicInvoice = convertPrismaInvoiceToInvoice(updatedInvoice);

    return NextResponse.json({
      data: publicInvoice,
      message: '請求書を更新しました',
    });
  } catch (error) {
    return handleApiError(error, 'Invoice update');
  }
}

/**
 * 請求書削除API（論理削除）
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: invoiceId } = invoiceParamsSchema.parse(await context.params);
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    await deleteInvoice(invoiceId, company.id);

    return NextResponse.json({
      message: '請求書を削除しました',
    });
  } catch (error) {
    return handleApiError(error, 'Invoice delete');
  }
}

/**
 * 請求書ステータス更新API
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id: invoiceId } = invoiceParamsSchema.parse(await context.params);
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }
    const body = await request.json();

    // リクエストタイプによって処理を分岐
    if ('status' in body && 'paymentDate' in body) {
      // 支払情報更新
      const validatedData = invoiceSchemas.updatePayment.parse(body);
      const updatedInvoice = await updatePaymentInfo(
        invoiceId,
        company.id,
        validatedData
      );
      const publicInvoice = convertPrismaInvoiceToInvoice(updatedInvoice);

      return NextResponse.json({
        data: publicInvoice,
        message: '支払情報を更新しました',
      });
    } else if ('status' in body) {
      // ステータス更新のみ
      const validatedData = statusUpdateInvoiceSchema.parse(body);
      const paymentDate = body.paymentDate
        ? new Date(body.paymentDate)
        : undefined;

      const updatedInvoice = await updateInvoiceStatus(
        invoiceId,
        company.id,
        validatedData.status,
        paymentDate
      );
      const publicInvoice = convertPrismaInvoiceToInvoice(updatedInvoice);

      return NextResponse.json({
        data: publicInvoice,
        message: 'ステータスを更新しました',
      });
    } else {
      return NextResponse.json(
        apiErrors.badRequest('statusまたはpaymentDateのいずれかが必要です'),
        { status: 400 }
      );
    }
  } catch (error) {
    return handleApiError(error, 'Invoice status update');
  }
}
