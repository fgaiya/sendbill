'use client';

import { useState, useRef, useEffect } from 'react';

import { X, AlertCircle, FileText, Calendar, CreditCard } from 'lucide-react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import type { CreateInvoiceFromQuoteData } from '@/lib/domains/invoices/schemas';
import { calculateQuoteTotal } from '@/lib/domains/quotes/calculations';
import type { Quote } from '@/lib/domains/quotes/types';
import { formatCurrency } from '@/lib/shared/utils/currency';
import { formatDate } from '@/lib/shared/utils/date';

interface InvoiceConversionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote;
  onSuccess: (invoiceId: string) => void;
}

export function InvoiceConversionDialog({
  isOpen,
  onClose,
  quote,
  onSuccess,
}: InvoiceConversionDialogProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string>();

  // フォーム状態
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // 初期化
  useEffect(() => {
    if (isOpen && quote.items) {
      setSelectedItemIds(quote.items.map((item) => item.id));
      setError(undefined);

      // デフォルトの支払期限（30日後）
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 30);
      setDueDate(defaultDueDate.toISOString().split('T')[0]);
    }
  }, [isOpen, quote.items]);

  // モーダル表示時のフォーカス管理
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const mainElement = document.querySelector('main');
      if (mainElement) {
        mainElement.setAttribute('aria-hidden', 'true');
      }

      return () => {
        document.body.style.overflow = '';
        if (mainElement) {
          mainElement.removeAttribute('aria-hidden');
        }
      };
    }
  }, [isOpen]);

  // Escapeキーで閉じる
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isConverting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isConverting, onClose]);

  const handleItemToggle = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (quote.items) {
      setSelectedItemIds(quote.items.map((item) => item.id));
    }
  };

  const handleDeselectAll = () => {
    setSelectedItemIds([]);
  };

  const handleConvert = async () => {
    if (selectedItemIds.length === 0) {
      setError('変換する品目を選択してください');
      return;
    }

    setIsConverting(true);
    setError(undefined);

    try {
      const requestData: CreateInvoiceFromQuoteData = {
        issueDate: new Date(issueDate),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes: notes || undefined,
        selectedItemIds:
          selectedItemIds.length === quote.items?.length
            ? undefined
            : selectedItemIds,
      };

      const response = await fetch(`/api/invoices/from-quote/${quote.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        let errorMessage = '請求書の作成に失敗しました';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // JSON以外のレスポンスの場合はデフォルトメッセージを使用
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      onSuccess(result.data.id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '請求書の作成に失敗しました';
      setError(message);
    } finally {
      setIsConverting(false);
    }
  };

  if (!isOpen) return null;

  const selectedItems =
    quote.items?.filter((item) => selectedItemIds.includes(item.id)) || [];
  const selectedTotals =
    selectedItems.length > 0
      ? calculateQuoteTotal(
          selectedItems.map((item) => ({
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

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conversion-dialog-title"
    >
      {/* 背景オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={!isConverting ? onClose : undefined}
        aria-hidden="true"
      />

      {/* モーダルコンテンツ */}
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-green-600" />
            <h2
              id="conversion-dialog-title"
              className="text-xl font-semibold text-gray-900"
            >
              請求書作成
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isConverting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
            aria-label="ダイアログを閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="overflow-auto max-h-[calc(90vh-8rem)]">
          <div className="p-6 space-y-6">
            {/* エラー表示 */}
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* 見積書情報 */}
            <Card className="p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                元見積書
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">見積書番号:</span>
                  <span className="ml-2 text-gray-900">
                    {quote.quoteNumber || 'DRAFT'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">発行日:</span>
                  <span className="ml-2 text-gray-900">
                    {formatDate(quote.issueDate)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">取引先:</span>
                  <span className="ml-2 text-gray-900">
                    {quote.client?.name || '-'}
                  </span>
                </div>
              </div>
            </Card>

            {/* 請求書設定 */}
            <Card className="p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                請求書設定
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="issueDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    <Calendar className="w-4 h-4 inline mr-1" />
                    発行日 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="issueDate"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    disabled={isConverting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="dueDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    <CreditCard className="w-4 h-4 inline mr-1" />
                    支払期限
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    disabled={isConverting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
                <div className="md:col-span-2">
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    備考
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isConverting}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    placeholder="請求書に記載する備考があれば入力してください"
                  />
                </div>
              </div>
            </Card>

            {/* 品目選択 */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  転記する品目
                </h3>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={isConverting}
                  >
                    すべて選択
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAll}
                    disabled={isConverting}
                  >
                    すべて解除
                  </Button>
                </div>
              </div>

              {quote.items && quote.items.length > 0 ? (
                <div className="space-y-2">
                  {quote.items.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedItemIds.includes(item.id)}
                        onChange={() => handleItemToggle(item.id)}
                        disabled={isConverting}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">
                          {item.description}
                        </div>
                        <div className="text-sm text-gray-500">
                          数量: {item.quantity}
                          {item.unit && ` ${item.unit}`} ×{' '}
                          {formatCurrency(item.unitPrice)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(
                            item.unitPrice * item.quantity - item.discountAmount
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  品目がありません
                </p>
              )}
            </Card>

            {/* 合計プレビュー */}
            {selectedTotals && (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  請求予定金額
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">選択品目</span>
                    <span className="text-gray-900">
                      {selectedItems.length}件
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">小計</span>
                    <span className="text-gray-900">
                      {formatCurrency(selectedTotals.subtotal)}
                    </span>
                  </div>
                  {selectedTotals.taxSummary.map((tax, index) => (
                    <div
                      key={`${tax.category}-${index}`}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-gray-600">
                        消費税（{tax.taxRate}%）
                      </span>
                      <span className="text-gray-900">
                        {formatCurrency(tax.taxAmount)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-blue-300 pt-2 mt-2">
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-gray-900">合計</span>
                      <span className="text-gray-900">
                        {formatCurrency(selectedTotals.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedItems.length}件の品目を請求書に転記します
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={isConverting}>
              キャンセル
            </Button>
            <Button
              onClick={handleConvert}
              disabled={isConverting || selectedItemIds.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isConverting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  作成中...
                </>
              ) : (
                '請求書を作成'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
