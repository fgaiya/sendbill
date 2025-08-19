'use client';

import React, { useState } from 'react';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { QuoteSortOption, QuoteStatus } from '@/lib/domains/quotes/types';

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
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const sortOptions = [
    { value: 'createdAt_desc', label: '作成日（新しい順）' },
    { value: 'createdAt_asc', label: '作成日（古い順）' },
    { value: 'issueDate_desc', label: '発行日（新しい順）' },
    { value: 'issueDate_asc', label: '発行日（古い順）' },
    { value: 'quoteNumber_desc', label: '見積書番号（降順）' },
    { value: 'quoteNumber_asc', label: '見積書番号（昇順）' },
  ] as const;

  const statusOptions = [
    { value: '', label: '全てのステータス' },
    { value: 'DRAFT', label: '下書き' },
    { value: 'SENT', label: '送信済み' },
    { value: 'ACCEPTED', label: '承認' },
    { value: 'DECLINED', label: '却下' },
  ] as const;

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
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <Input
              type="text"
              placeholder="見積書番号、取引先名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64"
            />
            <Button type="submit" variant="outline" size="sm">
              検索
            </Button>
          </form>

          {/* ステータスフィルタ */}
          <div>
            <label htmlFor="quote-status-select" className="sr-only">
              ステータス
            </label>
            <select
              id="quote-status-select"
              value={currentStatus || ''}
              onChange={(e) =>
                onStatusFilter((e.target.value as QuoteStatus) || undefined)
              }
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* ソート */}
          <div>
            <label htmlFor="quote-sort-select" className="sr-only">
              並び順
            </label>
            <select
              id="quote-sort-select"
              value={currentSort}
              onChange={(e) => onSort(e.target.value as typeof currentSort)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 新規作成ボタン */}
          <Link href="/dashboard/quotes/new">
            <Button className="whitespace-nowrap">新規作成</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
