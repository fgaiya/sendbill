import { notFound } from 'next/navigation';

import { QuoteDetail } from '@/components/domains/quotes/QuoteDetail';
import { convertPrismaQuoteToQuote } from '@/lib/domains/quotes/types';
import { prisma } from '@/lib/shared/prisma';
import { requireUserCompany } from '@/lib/shared/utils/auth';

interface QuoteDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: '見積書詳細 - SendBill',
  description: '見積書の詳細情報を確認できます',
};

export default async function QuoteDetailPage({
  params,
}: QuoteDetailPageProps) {
  const { id } = await params;
  const { company, error } = await requireUserCompany();

  if (error) {
    notFound();
  }

  const quote = await prisma.quote.findFirst({
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
  return <QuoteDetail quote={quoteData} />;
}
