import { Metadata } from 'next';

import { QuoteForm } from '@/components/domains/quotes/QuoteForm';

export const metadata: Metadata = {
  title: '新規見積書作成 | SendBill',
  description: '新しい見積書を作成します',
};

export default function NewQuotePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="sr-only">新規見積書作成</h1>
        <QuoteForm />
      </div>
    </main>
  );
}
