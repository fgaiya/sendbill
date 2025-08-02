import React from 'react';

import { Spinner } from '@/components/ui/spinner';
import {
  ClientListActions,
  ClientListParams,
  ClientListState,
} from '@/lib/domains/clients/types';

import { ClientListCards } from './ClientListCards';
import { ClientListEmpty } from './ClientListEmpty';
import { ClientListHeader } from './ClientListHeader';
import { ClientListPagination } from './ClientListPagination';
import { ClientListTable } from './ClientListTable';

interface ClientListViewProps {
  state: ClientListState;
  actions: ClientListActions;
  params: ClientListParams;
}

export function ClientListView({
  state,
  actions,
  params,
}: ClientListViewProps) {
  const { clients, isLoading, pagination } = state;
  const { setPage, setSort, setSearch } = actions;

  const handleReset = () => {
    setSearch('');
  };

  const isSearchResult = Boolean(params.q);
  const isEmpty = clients.length === 0 && !isLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <ClientListHeader
          totalCount={pagination.total}
          onSearch={setSearch}
          onSort={setSort}
          currentSort={params.sort || 'created_desc'}
        />

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {isEmpty ? (
            <ClientListEmpty
              isSearchResult={isSearchResult}
              onReset={handleReset}
            />
          ) : (
            <>
              {/* デスクトップ用テーブル */}
              <ClientListTable clients={clients} isLoading={isLoading} />

              {/* モバイル用カード */}
              <ClientListCards clients={clients} isLoading={isLoading} />

              {/* ページネーション */}
              {!isLoading && (
                <ClientListPagination
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

        {/* 全体ローディング */}
        {isLoading && clients.length === 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
              <Spinner size="sm" />
              <span className="text-gray-600">読み込み中...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
