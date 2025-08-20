import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { calculateItemsTotal } from '@/lib/domains/quotes/calculations';
import type { Quote } from '@/lib/domains/quotes/types';
import { formatDate } from '@/lib/shared/utils/date';

import { QuoteDeleteButton } from './QuoteDeleteButton';
import { QuoteStatusSelector } from './QuoteStatusSelector';

interface QuoteListCardsProps {
  quotes: Quote[];
  isLoading: boolean;
  onQuoteDeleted?: () => void;
  onStatusChange: (
    quoteId: string,
    newStatus: Quote['status']
  ) => Promise<void>;
}

export function QuoteListCards({
  quotes,
  isLoading,
  onQuoteDeleted,
  onStatusChange,
}: QuoteListCardsProps) {
  if (isLoading) {
    return (
      <div className="md:hidden space-y-4">
        {[...Array(5)].map((_, index) => (
          <Card key={index} className="p-4 animate-pulse">
            <div className="space-y-3">
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-6 bg-gray-200 rounded-full w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="md:hidden space-y-4">
      {quotes.map((quote) => (
        <Card key={quote.id} className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {quote.quoteNumber || '(未採番)'}
              </h3>
              <div className="flex items-center gap-2 text-sm font-medium whitespace-nowrap ml-2">
                <Link
                  href={`/dashboard/quotes/${quote.id}`}
                  className="text-blue-600 hover:text-blue-900 transition-colors"
                >
                  詳細
                </Link>
                <span className="text-gray-300">|</span>
                <button
                  disabled
                  className="text-gray-400 cursor-not-allowed"
                  title="編集機能は準備中です"
                >
                  編集
                </button>
                <span className="text-gray-300">|</span>
                <QuoteDeleteButton
                  quote={quote}
                  onDeleteSuccess={onQuoteDeleted}
                  asTextLink={true}
                />
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <span className="text-gray-500 w-16 shrink-0">取引先:</span>
                <span className="text-gray-900">
                  {quote.client?.name || '取引先未設定'}
                </span>
              </div>

              <div className="flex items-center">
                <span className="text-gray-500 w-16 shrink-0">金額:</span>
                <span className="text-gray-900">
                  {(() => {
                    if (!quote.items || quote.items.length === 0) {
                      return '品目なし';
                    }
                    try {
                      // QuoteItem型をQuoteItemFormData型に変換
                      const formItems = quote.items.map((item) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        discountAmount: item.discountAmount,
                        taxCategory: item.taxCategory,
                        taxRate: item.taxRate ?? undefined,
                        unit: item.unit ?? undefined,
                        sku: item.sku ?? undefined,
                        sortOrder: item.sortOrder,
                      }));
                      const { totalNetAmount, itemCount } =
                        calculateItemsTotal(formItems);
                      return (
                        new Intl.NumberFormat('ja-JP', {
                          style: 'currency',
                          currency: 'JPY',
                          minimumFractionDigits: 0,
                        }).format(totalNetAmount) + `（${itemCount}項目）`
                      );
                    } catch {
                      return '計算エラー';
                    }
                  })()}
                </span>
              </div>

              <div className="flex items-center">
                <span className="text-gray-500 w-16 shrink-0">ステータス:</span>
                <QuoteStatusSelector
                  quote={quote}
                  onStatusChange={onStatusChange}
                />
              </div>

              <div className="flex items-center">
                <span className="text-gray-500 w-16 shrink-0">発行日:</span>
                <span className="text-gray-900">
                  {formatDate(quote.issueDate) || '不正な日付'}
                </span>
              </div>

              {quote.expiryDate && (
                <div className="flex items-center">
                  <span className="text-gray-500 w-16 shrink-0">有効期限:</span>
                  <span className="text-gray-900">
                    {formatDate(quote.expiryDate) || '不正な日付'}
                  </span>
                </div>
              )}

              {quote.notes && (
                <div className="flex items-start">
                  <span className="text-gray-500 w-16 shrink-0">備考:</span>
                  <span className="text-gray-900 break-all">{quote.notes}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
