import { calculateItemsTotal } from '@/lib/domains/quotes/calculations';
import type { Quote } from '@/lib/domains/quotes/types';
import { formatDate } from '@/lib/shared/utils/date';

import { QuoteDeleteButton } from './QuoteDeleteButton';
import { QuoteStatusSelector } from './QuoteStatusSelector';

interface QuoteListTableProps {
  quotes: Quote[];
  isLoading: boolean;
  onQuoteDeleted?: () => void;
  onStatusChange: (
    quoteId: string,
    newStatus: Quote['status']
  ) => Promise<void>;
}

export function QuoteListTable({
  quotes,
  isLoading,
  onQuoteDeleted,
  onStatusChange,
}: QuoteListTableProps) {
  if (isLoading) {
    return (
      <div className="hidden md:block">
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300 border-separate [border-spacing:0]">
            <thead className="bg-gray-50 [&>tr>th:first-child]:rounded-tl-lg [&>tr>th:last-child]:rounded-tr-lg">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  見積書番号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  取引先
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  金額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  発行日
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  有効期限
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">操作</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 [&>tr:last-child>td:first-child]:rounded-bl-lg [&>tr:last-child>td:last-child]:rounded-br-lg">
              {[...Array(5)].map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:block">
      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300 border-separate [border-spacing:0]">
          <thead className="bg-gray-50 [&>tr>th:first-child]:rounded-tl-lg [&>tr>th:last-child]:rounded-tr-lg">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                見積書番号
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                取引先
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                金額
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                ステータス
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                発行日
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                有効期限
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">操作</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 [&>tr:last-child>td:first-child]:rounded-bl-lg [&>tr:last-child>td:last-child]:rounded-br-lg">
            {quotes.map((quote) => (
              <tr key={quote.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {quote.quoteNumber || '(未採番)'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {quote.client?.name || '取引先未設定'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
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
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <QuoteStatusSelector
                    quote={quote}
                    onStatusChange={onStatusChange}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(quote.issueDate) || '不正な日付'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {quote.expiryDate ? formatDate(quote.expiryDate) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      disabled
                      className="text-gray-400 cursor-not-allowed"
                      title="詳細表示機能は準備中です"
                    >
                      詳細
                    </button>
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
