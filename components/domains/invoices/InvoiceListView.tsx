'use client';

import type {
  UseInvoiceListState,
  UseInvoiceListActions,
  InvoiceListParams,
} from '@/lib/domains/invoices/hooks';

import { InvoiceListCards } from './InvoiceListCards';
import { InvoiceListEmpty } from './InvoiceListEmpty';
import { InvoiceListHeader } from './InvoiceListHeader';
import { InvoiceListPagination } from './InvoiceListPagination';
import { InvoiceListTable } from './InvoiceListTable';

interface InvoiceListViewProps {
  state: UseInvoiceListState;
  actions: UseInvoiceListActions;
  params: InvoiceListParams;
}

export function InvoiceListView({
  state,
  actions,
  params,
}: InvoiceListViewProps) {
  const { invoices, isLoading, pagination } = state;
  const {
    setPage,
    setSort,
    setSearch,
    setStatusFilter,
    setClientFilter,
    setQuoteFilter,
    setDateFilter,
    setDueDateFilter,
    refresh,
    updateInvoiceStatus,
  } = actions;

  const handleReset = () => {
    setSearch('');
    setStatusFilter(undefined);
    setClientFilter(undefined);
    setQuoteFilter(undefined);
    setDateFilter(undefined, undefined);
    setDueDateFilter(undefined, undefined);
  };

  const isSearchResult = Boolean(
    params.q ||
      params.status ||
      params.clientId ||
      params.quoteId ||
      params.dateFrom ||
      params.dateTo ||
      params.dueDateFrom ||
      params.dueDateTo
  );
  const isEmpty = invoices.length === 0 && !isLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <InvoiceListHeader
          totalCount={pagination.total}
          onSearch={setSearch}
          onSort={setSort}
          onStatusFilter={setStatusFilter}
          onClientFilter={setClientFilter}
          onQuoteFilter={setQuoteFilter}
          onDateFilter={setDateFilter}
          onDueDateFilter={setDueDateFilter}
          currentSort={params.sort || 'createdAt_desc'}
          currentStatus={params.status}
          currentClientId={params.clientId}
          currentQuoteId={params.quoteId}
          currentDateFrom={params.dateFrom}
          currentDateTo={params.dateTo}
          currentDueDateFrom={params.dueDateFrom}
          currentDueDateTo={params.dueDateTo}
        />

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {isEmpty ? (
            <InvoiceListEmpty
              isSearchResult={isSearchResult}
              onReset={handleReset}
            />
          ) : (
            <>
              {/* デスクトップ用テーブル */}
              <InvoiceListTable
                invoices={invoices}
                isLoading={isLoading}
                onInvoiceDeleted={refresh}
                onStatusChange={updateInvoiceStatus}
              />

              {/* モバイル用カード */}
              <InvoiceListCards
                invoices={invoices}
                isLoading={isLoading}
                onInvoiceDeleted={refresh}
                onStatusChange={updateInvoiceStatus}
              />

              {/* ページネーション */}
              {!isLoading && (
                <InvoiceListPagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  total={pagination.total}
                  limit={pagination.limit}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
