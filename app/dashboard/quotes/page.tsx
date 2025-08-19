import { QuoteList } from '@/components/domains/quotes';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '見積書一覧',
  description: '作成した見積書の一覧を表示・管理します',
};

export default function QuotesPage() {
  return <QuoteList />;
}
