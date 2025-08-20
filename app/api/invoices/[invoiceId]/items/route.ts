import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import {
  invoiceItemSchemas,
  bulkInvoiceItemsSchema,
} from '@/lib/domains/invoices/schemas';
import {
  getInvoiceItems,
  createInvoiceItem,
  replaceAllInvoiceItems,
  bulkProcessInvoiceItems,
} from '@/lib/domains/invoices/service';
import { convertPrismaInvoiceItemToInvoiceItem } from '@/lib/domains/invoices/types';
import { handleApiError } from '@/lib/shared/forms';
import { requireUserCompany } from '@/lib/shared/utils/auth';

const invoiceParamsSchema = z.object({
  invoiceId: z.uuid(),
});

type RouteContext = {
  params: Promise<{ invoiceId: string }>;
};

/**
 * 請求書品目一覧取得API
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { invoiceId } = invoiceParamsSchema.parse(await context.params);
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    const items = await getInvoiceItems(invoiceId, company.id);
    return NextResponse.json({
      data: items.map(convertPrismaInvoiceItemToInvoiceItem),
    });
  } catch (error) {
    return handleApiError(error, 'Invoice items fetch');
  }
}

/**
 * 請求書品目作成API
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { invoiceId } = invoiceParamsSchema.parse(await context.params);
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    const body = await request.json();
    const validatedData = invoiceItemSchemas.create.parse(body);

    const item = await createInvoiceItem(invoiceId, company.id, validatedData);
    const publicItem = convertPrismaInvoiceItemToInvoiceItem(item);

    return NextResponse.json(
      {
        data: publicItem,
        message: '品目を作成しました',
      },
      {
        status: 201,
        headers: {
          Location: `/api/invoices/${invoiceId}/items/${publicItem.id}`,
        },
      }
    );
  } catch (error) {
    return handleApiError(error, 'Invoice item creation');
  }
}

/**
 * 請求書品目完全置換API（既存全削除→新規一括作成）
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { invoiceId } = invoiceParamsSchema.parse(await context.params);
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    const body = await request.json();
    const validatedData = invoiceItemSchemas.replace.parse(body);

    const items = await replaceAllInvoiceItems(
      invoiceId,
      company.id,
      validatedData.items
    );
    return NextResponse.json({
      data: items.map(convertPrismaInvoiceItemToInvoiceItem),
      message: '品目を更新しました',
    });
  } catch (error) {
    return handleApiError(error, 'Invoice items replacement');
  }
}

/**
 * 請求書品目一括更新API（PATCH）
 * 既存品目の部分更新用（create/update/delete混在処理）
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { invoiceId } = invoiceParamsSchema.parse(await context.params);
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    const body = await request.json();
    const validatedData = bulkInvoiceItemsSchema.parse(body);

    const items = await bulkProcessInvoiceItems(
      invoiceId,
      company.id,
      validatedData
    );
    return NextResponse.json({
      data: items.map(convertPrismaInvoiceItemToInvoiceItem),
      message: '品目を更新しました',
    });
  } catch (error) {
    return handleApiError(error, 'Invoice items bulk update');
  }
}
