import { notFound } from 'next/navigation';

import { QuoteDetail } from '@/components/domains/quotes/QuoteDetail';
import { convertPrismaQuoteToQuote } from '@/lib/domains/quotes/types';
import { prisma } from '@/lib/shared/prisma';
import { requireUserCompany } from '@/lib/shared/utils/auth';

interface QuotePageProps {
  params: Promise<{ id: string }>;
}

export default async function QuotePage({ params }: QuotePageProps) {
  const { id } = await params;
  const { company, error } = await requireUserCompany();

  if (error) {
    notFound();
  }

  // 見積書を取得
  const quote = await prisma.quote.findFirst({
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

  if (!quote) {
    notFound();
  }

  const quoteData = convertPrismaQuoteToQuote(quote);

  return <QuoteDetail quote={quoteData} />;
}
