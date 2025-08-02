'use client';

import React from 'react';

import { Spinner } from '@/components/ui/spinner';
import { useClientList } from '@/lib/domains/clients/hooks';

import { ClientListCards } from './ClientListCards';
import { ClientListEmpty } from './ClientListEmpty';
import { ClientListHeader } from './ClientListHeader';
import { ClientListPagination } from './ClientListPagination';
import { ClientListTable } from './ClientListTable';

export function ClientList() {
  const { state, actions, params } = useClientList();
  const { clients, isLoading, error, pagination } = state;
  const { setPage, setSort, setSearch } = actions;

  const handleReset = () => {
    setSearch('');
  };

  const isSearchResult = Boolean(params.q);
  const isEmpty = clients.length === 0 && !isLoading;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  エラーが発生しました
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
