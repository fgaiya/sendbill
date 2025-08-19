import Link from 'next/link';

import { Search, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface QuoteListEmptyProps {
  isSearchResult?: boolean;
  onReset?: () => void;
}

export function QuoteListEmpty({
  isSearchResult = false,
  onReset,
}: QuoteListEmptyProps) {
  if (isSearchResult) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto max-w-md">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            検索結果が見つかりません
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            検索条件を変更してもう一度お試しください。
          </p>
          <div className="mt-6">
            <Button onClick={onReset} variant="outline">
              検索をリセット
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <div className="mx-auto max-w-md">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">
          見積書が作成されていません
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          最初の見積書を作成して始めましょう。
        </p>
        <div className="mt-6">
          <Link href="/dashboard/quotes/new">
            <Button>見積書を作成</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
