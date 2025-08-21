'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/shared/utils/ui';

interface DocumentListPaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function DocumentListPagination({
  currentPage,
  totalPages,
  total,
  limit,
  onPageChange,
}: DocumentListPaginationProps) {
  // ページネーションが不要な場合は非表示
  if (totalPages <= 1) {
    return null;
  }

  // 表示範囲の計算
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, total);

  // 表示するページ番号の配列を生成
  const getVisiblePages = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 7; // 表示する最大ページ数

    if (totalPages <= maxVisible) {
      // 全ページを表示
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 省略記号を含むページネーション
      if (currentPage <= 4) {
        // 前方
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // 後方
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // 中央
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 py-6">
      {/* 結果の表示 */}
      <div className="text-sm text-gray-700">
        {total}件中 {startItem}-{endItem}件を表示
      </div>

      {/* ページネーション */}
      <div className="flex items-center space-x-1">
        {/* 前のページボタン */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex items-center px-2 py-1"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">前へ</span>
        </Button>

        {/* ページ番号 */}
        <div className="flex items-center space-x-1">
          {visiblePages.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-1 text-gray-500"
                >
                  ...
                </span>
              );
            }

            return (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(page)}
                className={cn(
                  'px-3 py-1',
                  page === currentPage &&
                    'bg-blue-600 text-white hover:bg-blue-700'
                )}
              >
                {page}
              </Button>
            );
          })}
        </div>

        {/* 次のページボタン */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex items-center px-2 py-1"
        >
          <span className="hidden sm:inline mr-1">次へ</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
