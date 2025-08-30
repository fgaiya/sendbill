import { notFound } from 'next/navigation';

import { InvoicePreview } from '@/components/domains/invoices/InvoicePreview';
import { PrintControls } from '@/components/print/PrintControls';
import { convertPrismaInvoiceToInvoice } from '@/lib/domains/invoices/types';
import type { InvoiceWithRelations } from '@/lib/domains/invoices/types';
import { getPrisma } from '@/lib/shared/prisma';
import { requireUserCompany } from '@/lib/shared/utils/auth';
import { preparePrintPreviewData } from '@/lib/shared/utils/print';

interface InvoicePrintPageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoicePrintPage({
  params,
}: InvoicePrintPageProps) {
  const { id } = await params;
  const { company, error } = await requireUserCompany();

  if (error) {
    notFound();
  }

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
    },
  });

  if (!invoice) {
    notFound();
  }

  const invoiceData = convertPrismaInvoiceToInvoice(
    invoice as InvoiceWithRelations
  );

  const {
    formattedItems,
    companyForCalculation,
    companyForPreview,
    clientForPreview,
  } = preparePrintPreviewData(
    invoiceData.items || [],
    company,
    invoiceData.client || undefined
  );

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white p-8 print:p-0">
      <div className="max-w-4xl mx-auto">
        <PrintControls />

        <div className="print-page">
          <InvoicePreview
            items={formattedItems}
            company={companyForCalculation}
            companyForPreview={companyForPreview}
            client={clientForPreview}
            clientName={invoiceData.client?.name}
            issueDate={
              invoiceData.issueDate
                ? new Date(invoiceData.issueDate)
                : undefined
            }
            dueDate={
              invoiceData.dueDate ? new Date(invoiceData.dueDate) : undefined
            }
            title="請求書"
            notes={invoiceData.notes ?? undefined}
            invoiceNumber={invoiceData.invoiceNumber}
            className="avoid-break"
          />
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: InvoicePrintPageProps) {
  const { id } = await params;
  return {
    title: `請求書印刷プレビュー - ${id}`,
    robots: 'noindex, nofollow',
  };
}
