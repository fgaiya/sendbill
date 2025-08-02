import Link from 'next/link';

import { Button } from '@/components/ui/button';

interface ClientListEmptyProps {
  isSearchResult?: boolean;
  onReset?: () => void;
}

export function ClientListEmpty({
  isSearchResult = false,
  onReset,
}: ClientListEmptyProps) {
  if (isSearchResult) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto max-w-md">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33"
            />
          </svg>
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
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">
          取引先が登録されていません
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          最初の取引先を登録して始めましょう。
        </p>
        <div className="mt-6">
          <Link href="/dashboard/clients/new">
            <Button>取引先を登録</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
