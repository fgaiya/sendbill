'use client';

import { useMemo } from 'react';

import {
  calculateItemTax,
  calculateQuoteTotal,
  type CompanyForCalculation,
  type QuoteTotalCalculationResult,
  type TaxSummaryByRate,
  type TaxCalculationResult,
} from '@/lib/domains/quotes/calculations';
import type { QuoteItemFormData } from '@/lib/domains/quotes/form-schemas';
import {
  formatCurrency,
  formatNumber,
  getSummaryCategoryLabel,
} from '@/lib/shared/utils';
import type {
  CompanyForPreview,
  ClientForPreview,
} from '@/lib/shared/utils/print';

export interface QuotePreviewProps {
  items: QuoteItemFormData[];
  company: CompanyForCalculation;
  companyForPreview?: CompanyForPreview;
  client?: ClientForPreview;
  clientName?: string; // 後方互換性のため保持
  issueDate?: Date;
  expiryDate?: Date;
  title?: string;
  description?: string;
  notes?: string;
  quoteNumber?: string;
  className?: string;
}

/**
 * 見積書プレビューコンポーネント
 * リアルタイム計算結果とA4印刷レイアウトプレビューを提供
 */
export function QuotePreview({
  items,
  company,
  companyForPreview,
  client,
  clientName = '未選択',
  issueDate,
  expiryDate,
  title = '見積書',
  description,
  notes,
  quoteNumber,
  className = '',
}: QuotePreviewProps) {
  // 各行の計算結果をメモ化（フィルタリングせずに全行処理）
  const itemRows = useMemo<
    Array<{ item: QuoteItemFormData; result: TaxCalculationResult }>
  >(() => {
    return items.map((item) => ({
      item,
      result: calculateItemTax(item, company),
    }));
  }, [items, company]);

  // 全体の計算結果をメモ化（validItemsフィルタ廃止、calculateQuoteTotalに統一）
  const totalCalculation = useMemo<QuoteTotalCalculationResult>(() => {
    return calculateQuoteTotal(items, company);
  }, [items, company]);

  // 日付フォーマット
  const formatDate = (date?: Date): string => {
    if (!date) return '未設定';
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg shadow-sm print:shadow-none print:border-none print:rounded-none ${className}`}
    >
      {/* ヘッダー */}
      <div className="p-6 print:p-4 border-b border-gray-200 print:border-gray-400 print:border-b-2">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 print:text-black">
              {title}
            </h2>
            {quoteNumber && (
              <p className="mt-1 text-sm text-gray-600 print:text-gray-800">
                見積書番号: {quoteNumber}
              </p>
            )}
            {description && (
              <p className="mt-2 text-sm text-gray-600 print:text-gray-800">
                {description}
              </p>
            )}
          </div>
          <div className="text-right text-sm text-gray-600 print:text-gray-800">
            <div>発行日: {formatDate(issueDate)}</div>
            {expiryDate && <div>有効期限: {formatDate(expiryDate)}</div>}
          </div>
        </div>
      </div>

      {/* 発行者情報 */}
      {companyForPreview && (
        <div className="p-6 print:p-4 border-b border-gray-200 print:border-gray-400 print:border-b-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 print:text-black mb-2">
                発行者情報
              </h3>
              <div className="space-y-1 text-sm text-gray-700 print:text-gray-800">
                <div className="font-semibold">
                  {companyForPreview.companyName}
                </div>
                {companyForPreview.businessName && (
                  <div>屋号: {companyForPreview.businessName}</div>
                )}
                {companyForPreview.representativeName && (
                  <div>代表者: {companyForPreview.representativeName}</div>
                )}

                {/* 住所 */}
                {(companyForPreview.postalCode ||
                  companyForPreview.prefecture ||
                  companyForPreview.city ||
                  companyForPreview.street) && (
                  <div className="mt-2">
                    {companyForPreview.postalCode && (
                      <div>〒{companyForPreview.postalCode}</div>
                    )}
                    <div>
                      {[
                        companyForPreview.prefecture,
                        companyForPreview.city,
                        companyForPreview.street,
                      ]
                        .filter(Boolean)
                        .join('')}
                    </div>
                  </div>
                )}

                {/* 連絡先 */}
                {(companyForPreview.phone ||
                  companyForPreview.contactEmail) && (
                  <div className="mt-2">
                    {companyForPreview.phone && (
                      <div>TEL: {companyForPreview.phone}</div>
                    )}
                    {companyForPreview.contactEmail && (
                      <div>Email: {companyForPreview.contactEmail}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* インボイス登録番号 */}
            {companyForPreview.invoiceRegistrationNumber && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 print:text-black mb-2">
                  インボイス登録番号
                </h3>
                <div className="text-sm font-mono font-bold text-gray-900 print:text-black bg-yellow-50 print:bg-gray-100 p-3 print:p-2 rounded print:rounded-none border border-yellow-200 print:border-gray-400 print:border-2">
                  {companyForPreview.invoiceRegistrationNumber}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 宛先情報 */}
      <div className="p-6 print:p-4 border-b border-gray-200 print:border-gray-400">
        <h3 className="text-sm font-semibold text-gray-900 print:text-black mb-2">
          宛先情報
        </h3>
        {client ? (
          <div className="space-y-1 text-sm text-gray-700 print:text-gray-800">
            <div className="text-lg font-semibold text-gray-900 print:text-black">
              {client.name} 様
            </div>
            {client.contactName && <div>ご担当者: {client.contactName}</div>}
            {client.address && <div className="mt-1">{client.address}</div>}
            {(client.phone || client.contactEmail) && (
              <div className="mt-1">
                {client.phone && <div>TEL: {client.phone}</div>}
                {client.contactEmail && <div>Email: {client.contactEmail}</div>}
              </div>
            )}
          </div>
        ) : (
          <div className="text-lg font-semibold text-gray-900 print:text-black">
            {clientName} 様
          </div>
        )}
      </div>

      {/* 品目一覧 */}
      <div className="p-6 print:p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 print:border-gray-400">
                <th className="text-left py-3 px-2 font-semibold text-gray-900 print:text-black">
                  品目名
                </th>
                <th className="text-right py-3 px-2 font-semibold text-gray-900 print:text-black">
                  単価
                </th>
                <th className="text-right py-3 px-2 font-semibold text-gray-900 print:text-black">
                  数量
                </th>
                <th className="text-right py-3 px-2 font-semibold text-gray-900 print:text-black">
                  割引額
                </th>
                <th className="text-right py-3 px-2 font-semibold text-gray-900 print:text-black">
                  税率
                </th>
                <th className="text-right py-3 px-2 font-semibold text-gray-900 print:text-black">
                  金額
                  <div className="text-xs font-normal text-gray-500 print:text-gray-700">
                    (税込)
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {itemRows.map(({ item, result }, index) => {
                if (!item || !item.description) return null;

                return (
                  <tr
                    key={index}
                    className="border-b border-gray-100 print:border-gray-300 avoid-break"
                  >
                    <td className="py-3 px-2 text-gray-900 print:text-black">
                      {item.description}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-900 print:text-black">
                      {formatCurrency(item.unitPrice || 0)}
                      {company.priceIncludesTax ? (
                        <div className="text-xs text-gray-500 print:text-gray-700">
                          (税込)
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 print:text-gray-700">
                          (税抜)
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-900 print:text-black">
                      {formatNumber(item.quantity || 0)}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-900 print:text-black">
                      {item.discountAmount
                        ? formatCurrency(item.discountAmount)
                        : '-'}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-900 print:text-black">
                      {result.effectiveTaxRate}%
                      <div className="text-xs text-gray-500 print:text-gray-700">
                        {result.taxCategory === 'STANDARD' && '標準'}
                        {result.taxCategory === 'REDUCED' && '軽減'}
                        {result.taxCategory === 'EXEMPT' && '免税'}
                        {result.taxCategory === 'NON_TAX' && '非課税'}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right font-semibold text-gray-900 print:text-black">
                      {formatCurrency(result.lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 空状態表示 */}
        {itemRows.length === 0 && (
          <div className="text-center py-8 text-gray-500 print:text-gray-700">
            品目が登録されていません
          </div>
        )}
      </div>

      {/* 合計・税額内訳 */}
      <div className="p-6 border-t border-gray-200 print:border-gray-400 bg-gray-50 print:bg-white">
        <div className="max-w-md ml-auto space-y-3">
          {/* 税率別内訳 */}
          {totalCalculation.taxSummary.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-900 print:text-black">
                税率別内訳
              </h4>
              {totalCalculation.taxSummary.map((summary, index) => (
                <TaxSummaryRow key={index} summary={summary} />
              ))}
            </div>
          )}

          {/* 合計行 */}
          <div className="border-t border-gray-300 print:border-gray-600 pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 print:text-gray-800">
                小計（税抜）:
              </span>
              <span className="font-semibold text-gray-900 print:text-black">
                {formatCurrency(totalCalculation.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 print:text-gray-800">消費税:</span>
              <span className="font-semibold text-gray-900 print:text-black">
                {formatCurrency(totalCalculation.totalTax)}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-gray-300 print:border-gray-600 pt-2">
              <span className="text-gray-900 print:text-black">総額:</span>
              <span className="text-gray-900 print:text-black">
                {formatCurrency(totalCalculation.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 振込先情報 */}
      {companyForPreview &&
        (companyForPreview.bankName ||
          companyForPreview.bankBranch ||
          companyForPreview.bankAccountNumber) && (
          <div className="p-6 border-t border-gray-200 print:border-gray-400">
            <h4 className="text-sm font-semibold text-gray-900 print:text-black mb-3">
              お振込先
            </h4>
            <div className="bg-gray-50 print:bg-white p-4 rounded-lg border border-gray-200 print:border-gray-400">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 print:text-gray-800">
                {companyForPreview.bankName && (
                  <div>
                    <span className="font-semibold">銀行名:</span>{' '}
                    {companyForPreview.bankName}
                  </div>
                )}
                {companyForPreview.bankBranch && (
                  <div>
                    <span className="font-semibold">支店名:</span>{' '}
                    {companyForPreview.bankBranch}
                  </div>
                )}
                {companyForPreview.bankAccountType && (
                  <div>
                    <span className="font-semibold">口座種類:</span>{' '}
                    {companyForPreview.bankAccountType}
                  </div>
                )}
                {companyForPreview.bankAccountNumber && (
                  <div>
                    <span className="font-semibold">口座番号:</span>{' '}
                    {companyForPreview.bankAccountNumber}
                  </div>
                )}
                {companyForPreview.bankAccountHolder && (
                  <div className="col-span-2">
                    <span className="font-semibold">口座名義:</span>{' '}
                    {companyForPreview.bankAccountHolder}
                  </div>
                )}
              </div>
              <div className="mt-3 text-xs text-gray-500 print:text-gray-700">
                ※ 振込手数料はお客様ご負担でお願いいたします
              </div>
            </div>
          </div>
        )}

      {/* 備考セクション */}
      {notes && (
        <div className="p-6 border-t border-gray-200 print:border-gray-400">
          <h4 className="text-sm font-semibold text-gray-900 print:text-black mb-2">
            備考
          </h4>
          <div className="text-sm text-gray-700 print:text-gray-800 whitespace-pre-wrap">
            {notes}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 税率別集計行コンポーネント
 */
function TaxSummaryRow({ summary }: { summary: TaxSummaryByRate }) {
  const categoryLabel = getSummaryCategoryLabel(summary.category);
  const rateLabel =
    summary.taxRate === 0
      ? categoryLabel
      : `${categoryLabel}${summary.taxRate}%`;

  return (
    <div className="flex justify-between text-xs text-gray-600 print:text-gray-800">
      <span>
        {rateLabel} 対象: {formatCurrency(summary.taxableAmount)}
      </span>
      <span>税額: {formatCurrency(summary.taxAmount)}</span>
    </div>
  );
}
