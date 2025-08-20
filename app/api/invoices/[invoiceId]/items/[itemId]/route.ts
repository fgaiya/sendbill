import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import {
  invoiceItemSchemas,
  patchInvoiceItemSchema,
} from '@/lib/domains/invoices/schemas';
import {
  getInvoiceItem,
  updateInvoiceItem,
  deleteInvoiceItem,
} from '@/lib/domains/invoices/service';
import { convertPrismaInvoiceItemToInvoiceItem } from '@/lib/domains/invoices/types';
import { handleApiError } from '@/lib/shared/forms';
import { requireUserCompany } from '@/lib/shared/utils/auth';

const invoiceItemParamsSchema = z.object({
  invoiceId: z.uuid(),
  itemId: z.uuid(),
});

type RouteContext = {
  params: Promise<{ invoiceId: string; itemId: string }>;
};

/**
 * 請求書品目詳細取得API
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { invoiceId, itemId } = invoiceItemParamsSchema.parse(
      await context.params
    );
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    const item = await getInvoiceItem(invoiceId, itemId, company.id);

    if (!item) {
      return NextResponse.json(
        { error: '品目が見つかりません' },
        { status: 404 }
      );
    }

    const publicItem = convertPrismaInvoiceItemToInvoiceItem(item);

    return NextResponse.json({
      data: publicItem,
    });
  } catch (error) {
    return handleApiError(error, 'Invoice item fetch');
  }
}

/**
 * 請求書品目更新API
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { invoiceId, itemId } = invoiceItemParamsSchema.parse(
      await context.params
    );
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    const body = await request.json();
    const validatedData = invoiceItemSchemas.update.parse(body);

    const item = await updateInvoiceItem(
      invoiceId,
      itemId,
      company.id,
      validatedData
    );
    const publicItem = convertPrismaInvoiceItemToInvoiceItem(item);

    return NextResponse.json({
      data: publicItem,
      message: '品目を更新しました',
    });
  } catch (error) {
    return handleApiError(error, 'Invoice item update');
  }
}

/**
 * 請求書品目部分更新API
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { invoiceId, itemId } = invoiceItemParamsSchema.parse(
      await context.params
    );
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    const body = await request.json();
    const validatedData = patchInvoiceItemSchema.parse(body);

    const item = await updateInvoiceItem(
      invoiceId,
      itemId,
      company.id,
      validatedData
    );
    const publicItem = convertPrismaInvoiceItemToInvoiceItem(item);

    return NextResponse.json({
      data: publicItem,
      message: '品目を更新しました',
    });
  } catch (error) {
    return handleApiError(error, 'Invoice item patch');
  }
}

/**
 * 請求書品目削除API
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { invoiceId, itemId } = invoiceItemParamsSchema.parse(
      await context.params
    );
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    await deleteInvoiceItem(invoiceId, itemId, company.id);

    return NextResponse.json({
      message: '品目を削除しました',
    });
  } catch (error) {
    return handleApiError(error, 'Invoice item deletion');
  }
}
