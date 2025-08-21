'use client';

import Link from 'next/link';

import { Calendar, CreditCard, User, FileText } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { calculateItemsTotal } from '@/lib/domains/invoices/calculations';
import type { Invoice } from '@/lib/domains/invoices/types';
import { formatDate } from '@/lib/shared/utils/date';

import { InvoiceDeleteButton } from './InvoiceDeleteButton';
import { InvoiceStatusSelector } from './InvoiceStatusSelector';

interface InvoiceListCardsProps {
  invoices: Invoice[];
  isLoading: boolean;
  onInvoiceDeleted?: () => void;
  onStatusChange: (
    invoiceId: string,
    newStatus: Invoice['status']
  ) => Promise<void>;
}

export function InvoiceListCards({
  invoices,
  isLoading,
  onInvoiceDeleted,
  onStatusChange,
}: InvoiceListCardsProps) {
  if (isLoading) {
    return (
      <div className="md:hidden space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="md:hidden space-y-4">
      {invoices.map((invoice) => {
        const total = invoice.items
          ? calculateItemsTotal(invoice.items)
          : { totalAmount: 0 };

        return (
          <Card key={invoice.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Link
                    href={`/dashboard/invoices/${invoice.id}`}
                    className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {invoice.invoiceNumber || '(下書き)'}
                  </Link>
                  <div className="text-sm text-gray-600 mt-1">
                    {new Intl.NumberFormat('ja-JP', {
                      style: 'currency',
                      currency: 'JPY',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(total.totalAmount)}
                  </div>
                </div>
                <InvoiceStatusSelector
                  invoiceId={invoice.id}
                  currentStatus={invoice.status}
                  onStatusChange={onStatusChange}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{invoice.client?.name || '取引先未設定'}</span>
                </div>

                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>発行: {formatDate(invoice.issueDate)}</span>
                </div>

                {invoice.dueDate && (
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>支払期限: {formatDate(invoice.dueDate)}</span>
                  </div>
                )}

                {invoice.quote && (
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>見積書: {invoice.quote.quoteNumber}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-4">
                  <Link
                    href={`/dashboard/invoices/${invoice.id}/edit`}
                    className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                  >
                    編集
                  </Link>
                  <Link
                    href={`/dashboard/invoices/${invoice.id}`}
                    className="text-gray-600 hover:text-gray-800 hover:underline text-sm"
                  >
                    詳細
                  </Link>
                </div>
                <InvoiceDeleteButton
                  invoiceId={invoice.id}
                  invoiceNumber={invoice.invoiceNumber || '(下書き)'}
                  onDeleted={onInvoiceDeleted}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
