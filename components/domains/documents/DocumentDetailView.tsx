'use client';

import { useEffect, useState } from 'react';

import { Document as DocumentType, isQuote } from '@/lib/domains/documents';

import { DocumentContainer } from './DocumentContainer';

interface DocumentDetailViewProps {
  document: DocumentType;
  className?: string;
}

export function DocumentDetailView({
  document,
  className,
}: DocumentDetailViewProps) {
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string>();
  const [localStatus, setLocalStatus] = useState(document.status);

  useEffect(() => {
    setLocalStatus(document.status);
    setStatusError(undefined);
  }, [document.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = async (newStatus: DocumentType['status']) => {
    try {
      if (newStatus === localStatus || statusUpdating) return;
      setStatusError(undefined);
      setStatusUpdating(true);
      const isQuoteDoc = isQuote(document);
      const endpoint = isQuoteDoc
        ? `/api/quotes/${encodeURIComponent(String(document.id))}`
        : `/api/invoices/${encodeURIComponent(String(document.id))}`;
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        let msg = 'ステータス更新に失敗しました';
        try {
          const j = await res.json();
          msg = j.error || j.message || msg;
        } catch {}
        throw new Error(msg);
      }
      // 楽観更新: バッジ表示を即時更新
      setLocalStatus(newStatus);
    } catch (e) {
      setStatusError(e instanceof Error ? e.message : '更新に失敗しました');
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <DocumentContainer
      document={document}
      className={className}
      showMetadata={true}
      onStatusChange={handleStatusChange}
      statusUpdating={statusUpdating}
      statusError={statusError}
      localStatus={localStatus}
    />
  );
}
