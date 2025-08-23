'use client';

import { ReactNode } from 'react';

import Link from 'next/link';

import { InvoiceStatusBadge } from '@/components/domains/invoices/InvoiceStatusBadge';
import { QuoteStatusBadge } from '@/components/domains/quotes/QuoteStatusBadge';
import { Card } from '@/components/ui/card';
import type { Document as DocumentType } from '@/lib/domains/documents';
import type { Invoice, InvoiceStatus } from '@/lib/domains/invoices/types';
import { calculateQuoteTotal } from '@/lib/domains/quotes/calculations';
import type { Quote, QuoteStatus } from '@/lib/domains/quotes/types';
import { formatDate, cn } from '@/lib/shared/utils';
import { formatCurrency } from '@/lib/shared/utils/currency';

interface DocumentContainerProps {
  document: DocumentType | Quote | Invoice;
  className?: string;

  // レイアウト制御
  showHeader?: boolean;
  showMetadata?: boolean;

  // カスタマイズ可能なセクション
  headerContent?: ReactNode;
  actionButtons?: ReactNode;
  additionalSections?: ReactNode;

  // ステータス更新機能
  onStatusChange?: (newStatus: DocumentType['status']) => Promise<void>;
  statusUpdating?: boolean;
  statusError?: string;
  localStatus?: DocumentType['status'];
}

export function DocumentContainer({
  document,
  className,
  showHeader = false,
  showMetadata = true,
  headerContent,
  actionButtons,
  additionalSections,
  onStatusChange,
  statusUpdating = false,
  statusError,
  localStatus,
}: DocumentContainerProps) {
  const isQuoteDocument = 'expiryDate' in document && !('dueDate' in document);
  const displayStatus = localStatus || document.status;
  const displayNumber = isQuoteDocument
    ? (document as Quote).quoteNumber
    : (document as Invoice).invoiceNumber;

  // 金額計算（見積書と請求書で同じロジックを使用）
  const totals = document.items
    ? calculateQuoteTotal(
        document.items.map((item) => ({
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
    <div className={cn('space-y-6', className)}>
      {/* カスタムヘッダー（ページ用） */}
      {showHeader && (headerContent || actionButtons) && (
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">{headerContent}</div>
            {actionButtons && <div className="flex gap-3">{actionButtons}</div>}
          </div>
        </div>
      )}

      {/* 基本情報 */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">
              {isQuoteDocument ? '見積書番号' : '請求書番号'}
            </dt>
            <dd className="text-sm text-gray-900">{displayNumber}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">
              ステータス
            </dt>
            <dd className="text-sm text-gray-900 flex items-center gap-2">
              {isQuoteDocument ? (
                <QuoteStatusBadge status={displayStatus as QuoteStatus} />
              ) : (
                <InvoiceStatusBadge status={displayStatus as InvoiceStatus} />
              )}

              {/* ステータス変更機能（オプション） */}
              {onStatusChange && (
                <select
                  aria-label="ステータス変更"
                  className="ml-2 border rounded px-2 py-1 text-xs text-gray-800"
                  value={displayStatus}
                  disabled={statusUpdating}
                  onChange={(e) =>
                    onStatusChange(e.target.value as DocumentType['status'])
                  }
                >
                  {isQuoteDocument ? (
                    <>
                      <option value="DRAFT">下書き</option>
                      <option value="SENT">送信済み</option>
                      <option value="ACCEPTED">承認済み</option>
                      <option value="DECLINED">却下</option>
                    </>
                  ) : (
                    <>
                      <option value="DRAFT">下書き</option>
                      <option value="SENT">送信済み</option>
                      <option value="PAID">支払い済み</option>
                      <option value="OVERDUE">期限切れ</option>
                    </>
                  )}
                </select>
              )}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">発行日</dt>
            <dd className="text-sm text-gray-900">
              {formatDate(document.issueDate)}
            </dd>
          </div>

          {/* 見積書: 有効期限、請求書: 支払期限 */}
          {isQuoteDocument ? (
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">
                有効期限
              </dt>
              <dd className="text-sm text-gray-900">
                {document.expiryDate ? formatDate(document.expiryDate) : '-'}
              </dd>
            </div>
          ) : (
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">
                支払期限
              </dt>
              <dd className="text-sm text-gray-900">
                {document.dueDate ? formatDate(document.dueDate) : '-'}
              </dd>
            </div>
          )}

          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">取引先</dt>
            <dd className="text-sm text-gray-900">
              {document.client ? (
                <Link
                  href={`/dashboard/clients/${document.client.id}`}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {document.client.name}
                </Link>
              ) : (
                '-'
              )}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">作成者</dt>
            <dd className="text-sm text-gray-900">-</dd>
          </div>
        </dl>
      </Card>

      {/* メモ・備考 */}
      {document.notes && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            メモ・備考
          </h2>
          <div className="text-sm text-gray-700 whitespace-pre-wrap">
            {document.notes}
          </div>
        </Card>
      )}

      {/* 明細項目 */}
      {document.items && document.items.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {isQuoteDocument ? '品目' : '明細項目'}
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    品目・サービス
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    数量
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    単価
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    割引額
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金額
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    税区分
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {document.items.map((item, index) => {
                  const lineAmount =
                    item.quantity * item.unitPrice - (item.discountAmount || 0);

                  return (
                    <tr key={item.id || index}>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{item.description}</div>
                          {item.sku && (
                            <div className="text-xs text-gray-500 mt-1">
                              SKU: {item.sku}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-right">
                        {item.quantity}
                        {item.unit && (
                          <span className="text-xs text-gray-500 ml-1">
                            {item.unit}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-right">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-right">
                        {item.discountAmount
                          ? formatCurrency(item.discountAmount)
                          : '-'}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(lineAmount)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 text-center">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            item.taxCategory === 'STANDARD' &&
                              'bg-blue-100 text-blue-800',
                            item.taxCategory === 'REDUCED' &&
                              'bg-green-100 text-green-800',
                            item.taxCategory === 'EXEMPT' &&
                              'bg-yellow-100 text-yellow-800',
                            item.taxCategory === 'NON_TAX' &&
                              'bg-gray-100 text-gray-800'
                          )}
                        >
                          {item.taxCategory === 'STANDARD' && '標準'}
                          {item.taxCategory === 'REDUCED' && '軽減'}
                          {item.taxCategory === 'EXEMPT' && '非課税'}
                          {item.taxCategory === 'NON_TAX' && '不課税'}
                        </span>
                        {item.taxRate !== undefined &&
                          item.taxRate !== null && (
                            <div className="text-xs text-gray-500 mt-1">
                              {item.taxRate}%
                            </div>
                          )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 金額合計 */}
      {totals && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {isQuoteDocument ? '合計' : '金額合計'}
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">小計</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(totals.subtotal)}
              </span>
            </div>

            {totals.taxSummary.map((tax, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-sm text-gray-600">
                  {tax.category === 'standard'
                    ? '標準税率'
                    : tax.category === 'reduced'
                      ? '軽減税率'
                      : tax.category === 'exempt'
                        ? '非課税'
                        : '不課税'}
                  {tax.taxRate !== null &&
                    tax.taxRate !== undefined &&
                    ` (${tax.taxRate}%)`}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(tax.taxAmount)}
                </span>
              </div>
            ))}

            <div className="border-t pt-3">
              <div className="flex justify-between">
                <span className="text-base font-semibold text-gray-900">
                  合計
                </span>
                <span className="text-base font-bold text-gray-900">
                  {formatCurrency(totals.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ステータスエラー表示 */}
      {statusError && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-sm text-red-800">{statusError}</div>
        </Card>
      )}

      {/* メタ情報（作成日・更新日） */}
      {showMetadata && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">詳細情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">作成日</dt>
              <dd className="text-sm text-gray-900">
                {formatDate(document.createdAt)}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">
                最終更新
              </dt>
              <dd className="text-sm text-gray-900">
                {formatDate(document.updatedAt)}
              </dd>
            </div>
          </div>
        </Card>
      )}

      {/* カスタム追加セクション */}
      {additionalSections}
    </div>
  );
}
