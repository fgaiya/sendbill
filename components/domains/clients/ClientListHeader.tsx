'use client';

import React, { useState } from 'react';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ClientListHeaderProps {
  totalCount: number;
  onSearch: (query: string) => void;
  onSort: (
    sort: 'name_asc' | 'name_desc' | 'created_asc' | 'created_desc'
  ) => void;
  currentSort: 'name_asc' | 'name_desc' | 'created_asc' | 'created_desc';
}

export function ClientListHeader({
  totalCount,
  onSearch,
  onSort,
  currentSort,
}: ClientListHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const sortOptions = [
    { value: 'created_desc', label: '登録日（新しい順）' },
    { value: 'created_asc', label: '登録日（古い順）' },
    { value: 'name_asc', label: '名前（あ〜ん）' },
    { value: 'name_desc', label: '名前（ん〜あ）' },
  ] as const;

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
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <Input
              type="text"
              placeholder="取引先名、担当者名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64"
            />
            <Button type="submit" variant="outline" size="sm">
              検索
            </Button>
          </form>

          {/* ソート */}
          <select
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

          {/* 新規登録ボタン */}
          <Link href="/dashboard/clients/new">
            <Button className="whitespace-nowrap">新規登録</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
