'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { formatDate, formatDateTime } from '@/lib/shared/utils/date';

interface ConversionHistoryItem {
  id: string;
  conversionDate: string;
  userId: string;
  invoice: {
    id: string;
    invoiceNumber: string;
    issueDate: string;
    status: string;
  };
  selectedItemsCount: number;
  issueDate: string;
  dueDate?: string;
  notes?: string;
  errorMessage?: string;
}

interface ConversionHistorySectionProps {
  quoteId: string;
}

export function ConversionHistorySection({
  quoteId,
}: ConversionHistorySectionProps) {
  const [history, setHistory] = useState<ConversionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setError(undefined);

        const response = await fetch(
          `/api/quotes/${quoteId}/conversion-history`
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('見積書が見つかりません');
          }
          let errorMessage = '変換履歴の取得に失敗しました';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // JSON以外のレスポンスの場合はデフォルトメッセージを使用
          }
          throw new Error(errorMessage);
        }

        const responseData = await response.json();
        setHistory(responseData.data || []);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '変換履歴の取得に失敗しました';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchHistory();
  }, [quoteId]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">変換履歴</h2>
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">変換履歴</h2>
        <p className="text-red-600 text-center py-8">{error}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">変換履歴</h2>

      {history.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          まだ請求書に変換されていません
        </p>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    変換完了
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDateTime(item.conversionDate)}
                  </span>
                </div>
                {item.errorMessage && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    エラーあり
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                  <dt className="text-xs font-medium text-gray-500">
                    作成された請求書
                  </dt>
                  <dd className="text-sm text-gray-900">
                    <Link
                      href={`/dashboard/invoices/${item.invoice.id}`}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {item.invoice.invoiceNumber || 'DRAFT'}
                    </Link>
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-gray-500">
                    請求書発行日
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {formatDate(item.issueDate)}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-gray-500">
                    支払期限
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {item.dueDate ? formatDate(item.dueDate) : '-'}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-gray-500">
                    コピーした品目数
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {item.selectedItemsCount}件
                  </dd>
                </div>
              </div>

              {item.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <dt className="text-xs font-medium text-gray-500 mb-1">
                    備考
                  </dt>
                  <dd className="text-sm text-gray-900 whitespace-pre-wrap">
                    {item.notes}
                  </dd>
                </div>
              )}

              {item.errorMessage && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <dt className="text-xs font-medium text-red-500 mb-1">
                    エラー詳細
                  </dt>
                  <dd className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {item.errorMessage}
                  </dd>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
