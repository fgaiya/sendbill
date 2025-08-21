'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { SearchForm } from '@/components/ui/SearchForm';
import { SortSelect } from '@/components/ui/SortSelect';
import { ClientSortOption } from '@/lib/domains/clients/types';
import { CLIENT_SORT_OPTIONS } from '@/lib/shared/constants/list-options';

interface ClientListHeaderProps {
  totalCount: number;
  onSearch: (query: string) => void;
  onSort: (sort: ClientSortOption) => void;
  currentSort: ClientSortOption;
}

export function ClientListHeader({
  totalCount,
  onSearch,
  onSort,
  currentSort,
}: ClientListHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">取引先一覧</h1>
          <p className="text-sm text-gray-600 mt-1">
            {totalCount}件の取引先が登録されています
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* 検索フォーム */}
          <SearchForm
            placeholder="取引先名、担当者名で検索..."
            onSubmit={onSearch}
          />

          {/* ソート */}
          <SortSelect
            options={CLIENT_SORT_OPTIONS}
            value={currentSort}
            onChange={onSort}
          />

          {/* 新規登録ボタン */}
          <Link href="/dashboard/clients/new">
            <Button className="whitespace-nowrap">新規登録</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
