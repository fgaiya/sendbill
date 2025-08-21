'use client';

import { useState } from 'react';

import Link from 'next/link';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { SearchForm } from '@/components/ui/SearchForm';
import { SortSelect } from '@/components/ui/SortSelect';
import { StatusSelect } from '@/components/ui/StatusSelect';
import type { DocumentSortOption } from '@/lib/domains/documents/types';
import {
  DOCUMENT_SORT_OPTIONS,
  DOCUMENT_STATUS_OPTIONS,
} from '@/lib/shared/constants/list-options';

interface DocumentListHeaderProps {
  summary: {
    quotesCount: number;
    invoicesCount: number;
    totalCount: number;
  };
  onSearch: (query: string) => void;
  onSort: (sort: DocumentSortOption) => void;
  onStatusFilter: (status: string | undefined) => void;
  onClientFilter: (clientId: string | undefined) => void;
  onDateFilter: (dateFrom?: string, dateTo?: string) => void;
  currentSort: DocumentSortOption;
  currentStatus?: string;
  currentClientId?: string;
  currentDateFrom?: string;
  currentDateTo?: string;
  selectedDocuments?: Set<string>;
  onBulkDelete?: (documentIds: string[]) => Promise<{
    deletedCount: number;
    failedCount: number;
    total: number;
  }>;
  onClearSelection?: () => void;
}

export function DocumentListHeader({
  summary,
  onSearch,
  onSort,
  onStatusFilter,
  currentSort,
  currentStatus,
  selectedDocuments,
  onBulkDelete,
  onClearSelection,
}: DocumentListHeaderProps) {
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const handleBulkDelete = async () => {
    if (!selectedDocuments || !onBulkDelete || selectedDocuments.size === 0)
      return;

    const confirmed = window.confirm(
      `選択した${selectedDocuments.size}件の帳票を削除しますか？`
    );
    if (!confirmed) return;

    setIsBulkDeleting(true);
    try {
      const result = await onBulkDelete(Array.from(selectedDocuments));

      if (result.failedCount > 0) {
        toast.warning(
          `${result.deletedCount}件削除しました（${result.failedCount}件失敗）`
        );
      } else {
        toast.success(`${result.deletedCount}件の帳票を削除しました`);
      }
    } catch (error) {
      toast.error('一括削除に失敗しました');
      console.error('Bulk delete failed:', error);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl font-bold text-gray-900">帳票管理</h1>
            <p className="text-sm text-gray-600">
              見積書 {summary.quotesCount}件、請求書 {summary.invoicesCount}
              件（計 {summary.totalCount}件）
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            {/* 一括操作 */}
            {selectedDocuments && selectedDocuments.size > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedDocuments.size}件選択中
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                >
                  {isBulkDeleting ? '削除中...' : '一括削除'}
                </Button>
                {onClearSelection && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClearSelection}
                  >
                    選択解除
                  </Button>
                )}
              </div>
            )}

            {/* 検索フォーム */}
            <SearchForm placeholder="帳票を検索..." onSubmit={onSearch} />

            {/* 新規作成ドロップダウン */}
            <div className="relative">
              <Button asChild>
                <Link href="/dashboard/quotes/new">見積書を作成</Link>
              </Button>
            </div>
            <div className="relative">
              <Button asChild variant="outline">
                <Link href="/dashboard/invoices/new">請求書を作成</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* フィルター・ソート */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          {/* ステータスフィルター */}
          <StatusSelect
            options={DOCUMENT_STATUS_OPTIONS}
            value={currentStatus}
            onChange={onStatusFilter}
          />

          {/* ソート */}
          <SortSelect
            options={DOCUMENT_SORT_OPTIONS}
            value={currentSort}
            onChange={onSort}
          />
        </div>
      </div>
    </div>
  );
}
