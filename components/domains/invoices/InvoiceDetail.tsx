'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { DocumentContainer } from '@/components/domains/documents/DocumentContainer';
import { DocumentDeleteConfirm } from '@/components/domains/documents/DocumentDeleteConfirm';
import { DocumentHistorySection } from '@/components/domains/documents/DocumentHistorySection';
import { InvoiceStatusBadge } from '@/components/domains/invoices/InvoiceStatusBadge';
import { Button } from '@/components/ui/button';
import type { Invoice } from '@/lib/domains/invoices/types';

interface InvoiceDetailProps {
  invoice: Invoice;
}

export function InvoiceDetail({ invoice }: InvoiceDetailProps) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteSuccess = () => {
    router.push('/dashboard/documents?type=invoice');
  };

  const handleDeleteInvoice = async () => {
    try {
      setIsDeleting(true);

      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '請求書の削除に失敗しました');
      }

      toast.success('請求書を削除しました');
      handleDeleteSuccess();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '請求書の削除に失敗しました';

      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const headerContent = (
    <>
      <nav className="flex items-center text-sm text-gray-500 mb-4">
        <Link
          href="/dashboard/documents?type=invoice"
          className="hover:text-gray-700 transition-colors"
        >
          請求書一覧
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">
          {invoice.invoiceNumber || invoice.id}
        </span>
      </nav>

      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">
          {invoice.invoiceNumber || invoice.id}
        </h1>
        <InvoiceStatusBadge status={invoice.status} showIcon />
      </div>
    </>
  );

  const actionButtons = (
    <>
      <Button variant="outline" size="sm">
        <Link href={`/dashboard/invoices/${invoice.id}/edit`}>編集</Link>
      </Button>

      {invoice.status !== 'PAID' && (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteModal(true)}
          disabled={isDeleting}
        >
          {isDeleting ? '削除中...' : '削除'}
        </Button>
      )}
    </>
  );

  const additionalSections = <DocumentHistorySection document={invoice} />;

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DocumentContainer
          document={invoice}
          showHeader={true}
          showMetadata={true}
          headerContent={headerContent}
          actionButtons={actionButtons}
          additionalSections={additionalSections}
        />
      </div>

      {showDeleteModal && (
        <DocumentDeleteConfirm
          document={invoice}
          onConfirm={handleDeleteInvoice}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}
