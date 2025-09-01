import { notFound } from 'next/navigation';

import { InvoiceEdit } from '@/components/domains/invoices/InvoiceEdit';
import { convertPrismaInvoiceToInvoice } from '@/lib/domains/invoices/types';
import { getPrisma } from '@/lib/shared/prisma';
import { requireUserCompany } from '@/lib/shared/utils/auth';

interface InvoiceEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceEditPage({
  params,
}: InvoiceEditPageProps) {
  const { id } = await params;
  const { company, error } = await requireUserCompany();

  if (error) {
    notFound();
  }

  // 請求書を取得
  const invoice = await getPrisma().invoice.findFirst({
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

  // 支払い済みの請求書は編集不可
  if (invoice.status === 'PAID') {
    notFound();
  }

  const invoiceData = convertPrismaInvoiceToInvoice(invoice);

  return <InvoiceEdit invoice={invoiceData} />;
}
