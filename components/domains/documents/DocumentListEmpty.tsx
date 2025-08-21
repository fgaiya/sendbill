'use client';

import Link from 'next/link';

import { FileText, Receipt, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { DocumentType } from '@/lib/domains/documents/types';

interface DocumentListEmptyProps {
  isSearchResult: boolean;
  currentType: DocumentType | 'all';
  onReset: () => void;
}

export function DocumentListEmpty({
  isSearchResult,
  currentType,
  onReset,
}: DocumentListEmptyProps) {
  if (isSearchResult) {
    // 検索結果が空の場合
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            該当する帳票が見つかりません
          </h2>
          <p className="text-gray-600 text-center mb-6 max-w-md">
            検索条件を変更するか、フィルターをリセットしてください。
          </p>
          <Button onClick={onReset} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            フィルターをリセット
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 帳票が1件も作成されていない場合
  const getEmptyContent = () => {
    switch (currentType) {
      case 'quote':
        return {
          icon: FileText,
          title: '見積書がまだありません',
          description: '最初の見積書を作成して、取引先との商談を始めましょう。',
          actionLabel: '見積書を作成',
          actionHref: '/dashboard/quotes/new',
        };
      case 'invoice':
        return {
          icon: Receipt,
          title: '請求書がまだありません',
          description:
            '最初の請求書を作成して、取引先への請求管理を始めましょう。',
          actionLabel: '請求書を作成',
          actionHref: '/dashboard/invoices/new',
        };
      default:
        return {
          icon: FileText,
          title: '帳票がまだありません',
          description: '見積書や請求書を作成して、取引管理を始めましょう。',
          actionLabel: null,
          actionHref: null,
        };
    }
  };

  const content = getEmptyContent();
  const Icon = content.icon;

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Icon className="h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {content.title}
        </h2>
        <p className="text-gray-600 text-center mb-6 max-w-md">
          {content.description}
        </p>

        {content.actionLabel && content.actionHref ? (
          <Button asChild>
            <Link href={content.actionHref}>
              <Icon className="h-4 w-4 mr-2" />
              {content.actionLabel}
            </Link>
          </Button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild>
              <Link href="/dashboard/quotes/new">
                <FileText className="h-4 w-4 mr-2" />
                見積書を作成
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/invoices/new">
                <Receipt className="h-4 w-4 mr-2" />
                請求書を作成
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
