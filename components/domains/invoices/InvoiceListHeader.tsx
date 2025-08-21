'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { SearchForm } from '@/components/ui/SearchForm';
import { SortSelect } from '@/components/ui/SortSelect';
import { StatusSelect } from '@/components/ui/StatusSelect';
import type {
  InvoiceSortOption,
  InvoiceStatus,
} from '@/lib/domains/invoices/types';
import {
  INVOICE_SORT_OPTIONS,
  INVOICE_STATUS_OPTIONS,
} from '@/lib/shared/constants/list-options';

interface InvoiceListHeaderProps {
  totalCount: number;
  onSearch: (query: string) => void;
  onSort: (sort: InvoiceSortOption) => void;
  onStatusFilter: (status: InvoiceStatus | undefined) => void;
  onClientFilter: (clientId: string | undefined) => void;
  onQuoteFilter: (quoteId: string | undefined) => void;
  onDateFilter: (dateFrom?: string, dateTo?: string) => void;
  onDueDateFilter: (dueDateFrom?: string, dueDateTo?: string) => void;
  currentSort: InvoiceSortOption;
  currentStatus?: InvoiceStatus;
  currentClientId?: string;
  currentQuoteId?: string;
  currentDateFrom?: string;
  currentDateTo?: string;
  currentDueDateFrom?: string;
  currentDueDateTo?: string;
}

export function InvoiceListHeader({
  totalCount,
  onSearch,
  onSort,
  onStatusFilter,
  currentSort,
  currentStatus,
}: InvoiceListHeaderProps) {
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl font-bold text-gray-900">請求書</h1>
            <p className="text-sm text-gray-600">
              {totalCount}件の請求書が登録されています
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            {/* 検索フォーム */}
            <SearchForm placeholder="請求書を検索..." onSubmit={onSearch} />

            {/* 新規作成ボタン */}
            <Button asChild>
              <Link href="/dashboard/invoices/new">請求書を作成</Link>
            </Button>
          </div>
        </div>

        {/* フィルター・ソート */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          {/* ステータスフィルター */}
          <StatusSelect
            options={INVOICE_STATUS_OPTIONS}
            value={currentStatus}
            onChange={onStatusFilter}
          />

          {/* ソート */}
          <SortSelect
            options={INVOICE_SORT_OPTIONS}
            value={currentSort}
            onChange={onSort}
          />
        </div>
      </div>
    </div>
  );
}
