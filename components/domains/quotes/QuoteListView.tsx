'use client';

import type {
  UseQuoteListState,
  UseQuoteListActions,
  QuoteListParams,
} from '@/lib/domains/quotes/hooks';

import { QuoteListCards } from './QuoteListCards';
import { QuoteListEmpty } from './QuoteListEmpty';
import { QuoteListHeader } from './QuoteListHeader';
import { QuoteListPagination } from './QuoteListPagination';
import { QuoteListTable } from './QuoteListTable';

interface QuoteListViewProps {
  state: UseQuoteListState;
  actions: UseQuoteListActions;
  params: QuoteListParams;
}

export function QuoteListView({ state, actions, params }: QuoteListViewProps) {
  const { quotes, isLoading, pagination } = state;
  const {
    setPage,
    setSort,
    setSearch,
    setStatusFilter,
    setClientFilter,
    setDateFilter,
    refresh,
    updateQuoteStatus,
  } = actions;

  const handleReset = () => {
    setSearch('');
    setStatusFilter(undefined);
    setClientFilter(undefined);
    setDateFilter(undefined, undefined);
  };

  const isSearchResult = Boolean(
    params.q ||
      params.status ||
      params.clientId ||
      params.dateFrom ||
      params.dateTo
  );
  const isEmpty = quotes.length === 0 && !isLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <QuoteListHeader
          totalCount={pagination.total}
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
        />

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {isEmpty ? (
            <QuoteListEmpty
              isSearchResult={isSearchResult}
              onReset={handleReset}
            />
          ) : (
            <>
              {/* デスクトップ用テーブル */}
              <QuoteListTable
                quotes={quotes}
                isLoading={isLoading}
                onQuoteDeleted={refresh}
                onStatusChange={updateQuoteStatus}
              />

              {/* モバイル用カード */}
              <QuoteListCards
                quotes={quotes}
                isLoading={isLoading}
                onQuoteDeleted={refresh}
                onStatusChange={updateQuoteStatus}
              />

              {/* ページネーション */}
              {!isLoading && (
                <QuoteListPagination
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
