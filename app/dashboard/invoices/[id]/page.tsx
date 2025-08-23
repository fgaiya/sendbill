import { notFound } from 'next/navigation';

import { InvoiceDetail } from '@/components/domains/invoices/InvoiceDetail';
import { convertPrismaInvoiceToInvoice } from '@/lib/domains/invoices/types';
import type { InvoiceWithRelations } from '@/lib/domains/invoices/types';
import { prisma } from '@/lib/shared/prisma';
import { requireUserCompany } from '@/lib/shared/utils/auth';

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({
  params,
}: InvoiceDetailPageProps) {
  const { id } = await params;
  const { company, error } = await requireUserCompany();

  if (error) {
    notFound();
  }

  // 請求書を取得
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      companyId: company.id,
      deletedAt: null,
    },
    include: {
      client: true,
      items: {
        orderBy: {
          sortOrder: 'asc',
        },
      },
      quote: true,
    },
  });

  if (!invoice) {
    notFound();
  }

  const invoiceData = convertPrismaInvoiceToInvoice(
    invoice as InvoiceWithRelations
  );
  return <InvoiceDetail invoice={invoiceData} />;
}
