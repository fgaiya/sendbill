'use client';

import Link from 'next/link';

import { FileText, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface InvoiceListEmptyProps {
  isSearchResult: boolean;
  onReset: () => void;
}

export function InvoiceListEmpty({
  isSearchResult,
  onReset,
}: InvoiceListEmptyProps) {
  if (isSearchResult) {
    // 検索結果が空の場合
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            該当する請求書が見つかりません
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

  // 請求書が1件も作成されていない場合
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          請求書がまだありません
        </h2>
        <p className="text-gray-600 text-center mb-6 max-w-md">
          最初の請求書を作成して、取引先への請求管理を始めましょう。
        </p>
        <Button asChild>
          <Link href="/dashboard/invoices/new">
            <FileText className="h-4 w-4 mr-2" />
            請求書を作成
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
