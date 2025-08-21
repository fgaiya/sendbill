'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { SearchForm } from '@/components/ui/SearchForm';
import { SortSelect } from '@/components/ui/SortSelect';
import { StatusSelect } from '@/components/ui/StatusSelect';
import type { QuoteSortOption, QuoteStatus } from '@/lib/domains/quotes/types';
import {
  QUOTE_SORT_OPTIONS,
  QUOTE_STATUS_OPTIONS,
} from '@/lib/shared/constants/list-options';

interface QuoteListHeaderProps {
  totalCount: number;
  onSearch: (query: string) => void;
  onSort: (sort: QuoteSortOption) => void;
  onStatusFilter: (status: QuoteStatus | undefined) => void;
  onClientFilter: (clientId: string | undefined) => void;
  onDateFilter: (dateFrom?: string, dateTo?: string) => void;
  currentSort: QuoteSortOption;
  currentStatus?: QuoteStatus;
  currentClientId?: string;
  currentDateFrom?: string;
  currentDateTo?: string;
}

export function QuoteListHeader({
  totalCount,
  onSearch,
  onSort,
  onStatusFilter,
  currentSort,
  currentStatus,
}: QuoteListHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">見積書一覧</h1>
          <p className="text-sm text-gray-600 mt-1">
            {totalCount}件の見積書が登録されています
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* 検索フォーム */}
          <SearchForm
            placeholder="見積書番号、取引先名で検索..."
            onSubmit={onSearch}
          />

          {/* ステータスフィルタ */}
          <StatusSelect
            options={QUOTE_STATUS_OPTIONS}
            value={currentStatus}
            onChange={onStatusFilter}
          />

          {/* ソート */}
          <SortSelect
            options={QUOTE_SORT_OPTIONS}
            value={currentSort}
            onChange={onSort}
          />

          {/* 新規作成ボタン */}
          <Link href="/dashboard/quotes/new">
            <Button className="whitespace-nowrap">新規作成</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
