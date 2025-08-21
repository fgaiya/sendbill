import Link from 'next/link';

import { calculateItemsTotal } from '@/lib/domains/invoices/calculations';
import type { Invoice } from '@/lib/domains/invoices/types';
import { formatDate } from '@/lib/shared/utils/date';

import { InvoiceDeleteButton } from './InvoiceDeleteButton';
import { InvoiceStatusSelector } from './InvoiceStatusSelector';

interface InvoiceListTableProps {
  invoices: Invoice[];
  isLoading: boolean;
  onInvoiceDeleted?: () => void;
  onStatusChange: (
    invoiceId: string,
    newStatus: Invoice['status']
  ) => Promise<void>;
}

export function InvoiceListTable({
  invoices,
  isLoading,
  onInvoiceDeleted,
  onStatusChange,
}: InvoiceListTableProps) {
  if (isLoading) {
    return (
      <div className="hidden md:block">
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300 border-separate [border-spacing:0]">
            <thead className="bg-gray-50 [&>tr>th:first-child]:rounded-tl-lg [&>tr>th:last-child]:rounded-tr-lg">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  請求書番号
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
                  支払期限
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                請求書番号
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
                支払期限
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {invoices.map((invoice) => {
              const total = invoice.items
                ? calculateItemsTotal(invoice.items)
                : { totalAmount: 0 };

              return (
                <tr
                  key={invoice.id}
                  className="hover:bg-gray-50 transition-colors duration-150 border-b border-gray-200 last:border-0 [&>td:first-child]:rounded-bl-lg [&>td:last-child]:rounded-br-lg"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/dashboard/invoices/${invoice.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      {invoice.invoiceNumber || '(下書き)'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {invoice.client?.name || '取引先未設定'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {new Intl.NumberFormat('ja-JP', {
                        style: 'currency',
                        currency: 'JPY',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(total.totalAmount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <InvoiceStatusSelector
                      invoiceId={invoice.id}
                      currentStatus={invoice.status}
                      onStatusChange={onStatusChange}
                      disabled={isLoading}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(invoice.issueDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/dashboard/invoices/${invoice.id}/edit`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        編集
                      </Link>
                      <InvoiceDeleteButton
                        invoiceId={invoice.id}
                        invoiceNumber={invoice.invoiceNumber || '(下書き)'}
                        onDeleted={onInvoiceDeleted}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
