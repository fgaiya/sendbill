'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { calculateQuoteTotal } from '@/lib/domains/quotes/calculations';
import type { Quote } from '@/lib/domains/quotes/types';
import { formatCurrency } from '@/lib/shared/utils/currency';
import { formatDate } from '@/lib/shared/utils/date';

import { ConversionHistorySection } from './ConversionHistorySection';
import { ConvertToInvoiceButton } from './ConvertToInvoiceButton';
import { QuoteDeleteButton } from './QuoteDeleteButton';
import { QuoteStatusBadge } from './QuoteStatusBadge';

interface QuoteDetailProps {
  quoteId: string;
}

export function QuoteDetail({ quoteId }: QuoteDetailProps) {
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        setIsLoading(true);
        setError(undefined);

        const response = await fetch(
          `/api/quotes/${quoteId}?include=client,items`
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('見積書が見つかりません');
          }
          let errorMessage = '見積書の取得に失敗しました';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // JSON以外のレスポンスの場合はデフォルトメッセージを使用
          }
          throw new Error(errorMessage);
        }

        const responseData = await response.json();
        const quoteData: Quote = responseData.data || responseData;
        setQuote(quoteData);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '見積書の取得に失敗しました';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchQuote();
  }, [quoteId]);

  const handleDeleteSuccess = () => {
    router.push('/dashboard/quotes');
  };

  const handleConversionSuccess = (invoiceId: string) => {
    router.push(`/dashboard/invoices/${invoiceId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">エラー</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <Link href="/dashboard/quotes">
            <Button>見積書一覧に戻る</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            見積書が見つかりません
          </h1>
          <p className="text-gray-600 mb-8">
            指定された見積書は存在しないか、削除されている可能性があります。
          </p>
          <Link href="/dashboard/quotes">
            <Button>見積書一覧に戻る</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totals = quote.items
    ? calculateQuoteTotal(
        quote.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount,
          taxCategory: item.taxCategory,
          taxRate: item.taxRate ?? undefined,
          unit: item.unit ?? undefined,
          sku: item.sku ?? undefined,
          sortOrder: item.sortOrder,
        })),
        {
          standardTaxRate: 10,
          reducedTaxRate: 8,
          priceIncludesTax: false,
        }
      )
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <nav className="flex items-center text-sm text-gray-500 mb-4">
          <Link
            href="/dashboard/quotes"
            className="hover:text-gray-700 transition-colors"
          >
            見積書一覧
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{quote.quoteNumber || 'DRAFT'}</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {quote.quoteNumber || '見積書（下書き）'}
            </h1>
            <QuoteStatusBadge status={quote.status} showIcon />
          </div>

          <div className="flex gap-3">
            <Link href={`/dashboard/quotes/${quote.id}/edit`}>
              <Button variant="outline" size="sm">
                編集
              </Button>
            </Link>
            {(quote.status === 'ACCEPTED' || quote.status === 'SENT') && (
              <ConvertToInvoiceButton
                quote={quote}
                onSuccess={handleConversionSuccess}
              />
            )}
            <QuoteDeleteButton
              quote={quote}
              onDeleteSuccess={handleDeleteSuccess}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* 基本情報 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">
                見積書番号
              </dt>
              <dd className="text-sm text-gray-900">
                {quote.quoteNumber || '未採番'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">
                ステータス
              </dt>
              <dd className="text-sm text-gray-900">
                <QuoteStatusBadge status={quote.status} />
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">発行日</dt>
              <dd className="text-sm text-gray-900">
                {formatDate(quote.issueDate)}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">
                有効期限
              </dt>
              <dd className="text-sm text-gray-900">
                {quote.expiryDate ? formatDate(quote.expiryDate) : '-'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">取引先</dt>
              <dd className="text-sm text-gray-900">
                {quote.client ? (
                  <Link
                    href={`/dashboard/clients/${quote.client.id}`}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {quote.client.name}
                  </Link>
                ) : (
                  '-'
                )}
              </dd>
            </div>

            {quote.notes && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500 mb-1">備考</dt>
                <dd className="text-sm text-gray-900 whitespace-pre-wrap">
                  {quote.notes}
                </dd>
              </div>
            )}
          </div>
        </Card>

        {/* 品目一覧 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">品目</h2>
          {quote.items && quote.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      品目・サービス
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">
                      数量
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">
                      単価
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">
                      金額
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {item.description}
                        </div>
                        {item.sku && (
                          <div className="text-xs text-gray-500 mt-1">
                            SKU: {item.sku}
                          </div>
                        )}
                      </td>
                      <td className="text-right py-3 px-4 text-gray-900">
                        {item.quantity}
                        {item.unit && (
                          <span className="text-gray-500 ml-1">
                            {item.unit}
                          </span>
                        )}
                      </td>
                      <td className="text-right py-3 px-4 text-gray-900">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="text-right py-3 px-4 text-gray-900">
                        {formatCurrency(
                          item.unitPrice * item.quantity - item.discountAmount
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              品目が登録されていません
            </p>
          )}
        </Card>

        {/* 金額合計 */}
        {totals && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">合計</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">小計</span>
                <span className="text-gray-900">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>
              {totals.taxSummary.map((tax, index) => (
                <div
                  key={`${tax.category}-${index}`}
                  className="flex justify-between"
                >
                  <span className="text-gray-600">
                    消費税（{tax.taxRate}%）
                  </span>
                  <span className="text-gray-900">
                    {formatCurrency(tax.taxAmount)}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-gray-900">合計</span>
                  <span className="text-gray-900">
                    {formatCurrency(totals.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* 変換履歴 */}
        <ConversionHistorySection quoteId={quote.id} />
      </div>
    </div>
  );
}
