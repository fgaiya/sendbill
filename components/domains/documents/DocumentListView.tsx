'use client';

import { useState } from 'react';

import type {
  UseDocumentListState,
  UseDocumentListActions,
} from '@/lib/domains/documents/hooks';
import type {
  Document as DocumentType,
  DocumentListParams,
} from '@/lib/domains/documents/types';

import { DocumentDetailModal } from './DocumentDetailModal';
import { DocumentListEmpty } from './DocumentListEmpty';
import { DocumentListError } from './DocumentListError';
import { DocumentListHeader } from './DocumentListHeader';
import { DocumentListPagination } from './DocumentListPagination';
import { DocumentListTable } from './DocumentListTable';
import { DocumentTypeTab } from './DocumentTypeTab';

interface DocumentListViewProps {
  state: UseDocumentListState;
  actions: UseDocumentListActions;
  params: DocumentListParams;
}

export function DocumentListView({
  state,
  actions,
  params,
}: DocumentListViewProps) {
  const { documents, isLoading, error, pagination, summary } = state;
  const {
    setPage,
    setSort,
    setSearch,
    setTypeFilter,
    setStatusFilter,
    setClientFilter,
    setDateFilter,
    refresh,
  } = actions;

  // Client-side modal state for document details
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenDetail = (doc: DocumentType) => {
    setSelectedDocument(doc);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDocument(null);
    void refresh();
  };

  const handleReset = () => {
    setSearch('');
    setTypeFilter('all');
    setStatusFilter(undefined);
    setClientFilter(undefined);
    setDateFilter(undefined, undefined);
  };

  const effectiveType = params.type ?? 'all';
  const isSearchResult = Boolean(
    params.q ||
      effectiveType !== 'all' ||
      params.status ||
      params.clientId ||
      params.dateFrom ||
      params.dateTo
  );
  const isEmpty = documents.length === 0 && !isLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <DocumentListHeader
          summary={summary}
          onSearch={setSearch}
          onSort={setSort}
          onStatusFilter={setStatusFilter}
          onClientFilter={setClientFilter}
          onDateFilter={setDateFilter}
          currentSort={params.sort || 'createdAt_desc'}
          currentStatus={params.status}
          currentClientId={params.clientId}
          currentDateFrom={params.dateFrom}
          currentDateTo={params.dateTo}
          selectedDocuments={state.selectedDocuments}
          onBulkDelete={actions.bulkDelete}
          onClearSelection={actions.clearSelection}
        />

        {/* 種別タブ */}
        <div className="border-b border-gray-200 bg-white">
          <div className="px-4 sm:px-6 lg:px-8">
            <DocumentTypeTab
              currentType={params.type || 'all'}
              onTypeChange={setTypeFilter}
              summary={summary}
            />
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {error ? (
            <DocumentListError error={error} />
          ) : isEmpty ? (
            <DocumentListEmpty
              isSearchResult={isSearchResult}
              currentType={params.type || 'all'}
              onReset={handleReset}
            />
          ) : (
            <>
              {/* 統合テーブル */}
              <DocumentListTable
                documents={documents}
                isLoading={isLoading}
                onRefresh={refresh}
                selectedDocuments={state.selectedDocuments}
                toggleSelectDocument={actions.toggleSelectDocument}
                selectAllDocuments={actions.selectAllDocuments}
                clearSelection={actions.clearSelection}
                onOpenDetail={handleOpenDetail}
              />

              {/* ページネーション */}
              {!isLoading && (
                <DocumentListPagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  total={pagination.total}
                  limit={pagination.limit}
                  onPageChange={setPage}
                />
              )}

              {/* 詳細モーダル */}
              {selectedDocument && (
                <DocumentDetailModal
                  isOpen={isModalOpen}
                  onClose={handleCloseModal}
                  document={selectedDocument}
                  canDelete={
                    selectedDocument.documentType === 'invoice'
                      ? selectedDocument.status !== 'PAID'
                      : true // TODO: 見積書は別途 related-data 取得で厳密化
                  }
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
