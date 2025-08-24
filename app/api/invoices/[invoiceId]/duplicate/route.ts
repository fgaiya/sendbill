import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { duplicateInvoice } from '@/lib/domains/invoices/service';
import { convertPrismaInvoiceToInvoice } from '@/lib/domains/invoices/types';
import { handleApiError, commonValidationSchemas } from '@/lib/shared/forms';
import { requireUserCompany } from '@/lib/shared/utils/auth';

// パラメータスキーマ
const invoiceParamsSchema = z.object({
  invoiceId: commonValidationSchemas.cuid('請求書ID'),
});

interface RouteContext {
  params: Promise<{ invoiceId: string }>;
}

/**
 * 請求書複製API
 */
export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { invoiceId } = invoiceParamsSchema.parse(await context.params);
    const { company, error, status } = await requireUserCompany();
    if (error) {
      return NextResponse.json(error, { status });
    }

    const duplicated = await duplicateInvoice(company!.id, invoiceId);
    const publicInvoice = convertPrismaInvoiceToInvoice(duplicated);

    return NextResponse.json(
      { data: publicInvoice, message: '請求書を複製しました' },
      {
        status: 201,
        headers: { Location: `/api/invoices/${publicInvoice.id}` },
      }
    );
  } catch (error) {
    return handleApiError(error, 'Invoice duplicate');
  }
}
