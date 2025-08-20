import { QuoteDetail } from '@/components/domains/quotes/QuoteDetail';

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

  return <QuoteDetail quoteId={id} />;
}
