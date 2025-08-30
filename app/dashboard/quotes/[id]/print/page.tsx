import { notFound } from 'next/navigation';

import { QuotePreview } from '@/components/domains/quotes/QuotePreview';
import { PrintControls } from '@/components/print/PrintControls';
import { convertPrismaQuoteToQuote } from '@/lib/domains/quotes/types';
import { getPrisma } from '@/lib/shared/prisma';
import { requireUserCompany } from '@/lib/shared/utils/auth';
import { preparePrintPreviewData } from '@/lib/shared/utils/print';

interface QuotePrintPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuotePrintPage({ params }: QuotePrintPageProps) {
  const { id } = await params;
  const { company, error } = await requireUserCompany();

  if (error) {
    notFound();
  }

  const quote = await getPrisma().quote.findFirst({
    where: {
      id,
      companyId: company.id,
      deletedAt: null,
    },
    include: {
      client: true,
      items: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!quote) {
    notFound();
  }

  const quoteData = convertPrismaQuoteToQuote(quote);

  const {
    formattedItems,
    companyForCalculation,
    companyForPreview,
    clientForPreview,
  } = preparePrintPreviewData(
    quoteData.items || [],
    company,
    quoteData.client || undefined
  );

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white p-8 print:p-0">
      <div className="max-w-4xl mx-auto">
        <PrintControls />

        <div className="print-page">
          <QuotePreview
            items={formattedItems}
            company={companyForCalculation}
            companyForPreview={companyForPreview}
            client={clientForPreview}
            clientName={quoteData.client?.name}
            issueDate={
              quoteData.issueDate ? new Date(quoteData.issueDate) : undefined
            }
            expiryDate={
              quoteData.expiryDate ? new Date(quoteData.expiryDate) : undefined
            }
            title="見積書"
            notes={quoteData.notes || undefined}
            quoteNumber={quoteData.quoteNumber || undefined}
            className="avoid-break"
          />
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: QuotePrintPageProps) {
  const { id } = await params;
  return {
    title: `見積書印刷プレビュー - ${id}`,
    robots: 'noindex, nofollow',
  };
}
