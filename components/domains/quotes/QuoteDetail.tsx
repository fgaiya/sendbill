'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { DocumentContainer } from '@/components/domains/documents/DocumentContainer';
import { Button } from '@/components/ui/button';
import type { Quote } from '@/lib/domains/quotes/types';

import { ConversionHistorySection } from './ConversionHistorySection';
import { ConvertToInvoiceButton } from './ConvertToInvoiceButton';
import { QuoteDeleteButton } from './QuoteDeleteButton';
import { QuoteStatusBadge } from './QuoteStatusBadge';

interface QuoteDetailProps {
  quote: Quote;
}

export function QuoteDetail({ quote }: QuoteDetailProps) {
  const router = useRouter();

  const handleDeleteSuccess = () => {
    router.push('/dashboard/documents?type=quote');
  };

  // ヘッダーコンテンツの生成（ナビゲーション部分のみ）
  const headerContent = (
    <>
      <nav className="flex items-center text-sm text-gray-500 mb-4">
        <Link
          href="/dashboard/documents?type=quote"
          className="hover:text-gray-700 transition-colors"
        >
          見積書一覧
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{quote.quoteNumber || quote.id}</span>
      </nav>

      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">
          {quote.quoteNumber || quote.id}
        </h1>
        <QuoteStatusBadge status={quote.status} showIcon />
      </div>
    </>
  );

  // アクションボタンの生成
  const actionButtons = (
    <>
      <Button asChild variant="outline" size="sm">
        <Link href={`/dashboard/quotes/${quote.id}/edit`}>編集</Link>
      </Button>

      <ConvertToInvoiceButton
        quote={quote}
        onSuccess={(invoiceId) =>
          router.push(`/dashboard/invoices/${invoiceId}`)
        }
      />

      <QuoteDeleteButton quote={quote} onDeleteSuccess={handleDeleteSuccess} />
    </>
  );

  // 追加セクション（変換履歴）
  const additionalSections = <ConversionHistorySection quoteId={quote.id} />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <DocumentContainer
        document={quote}
        showHeader={true}
        showMetadata={true}
        headerContent={headerContent}
        actionButtons={actionButtons}
        additionalSections={additionalSections}
      />
    </div>
  );
}
