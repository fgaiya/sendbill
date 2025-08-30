import { notFound } from 'next/navigation';

import { QuoteEdit } from '@/components/domains/quotes/QuoteEdit';
import { convertPrismaQuoteToQuote } from '@/lib/domains/quotes/types';
import { getPrisma } from '@/lib/shared/prisma';
import { requireUserCompany } from '@/lib/shared/utils/auth';

interface QuoteEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuoteEditPage({ params }: QuoteEditPageProps) {
  const { id } = await params;
  const { company, error } = await requireUserCompany();

  if (error) {
    notFound();
  }

  // 見積書を取得
  const quote = await getPrisma().quote.findFirst({
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

  return <QuoteEdit quote={quoteData} />;
}
