'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

import { AlertTriangle, X, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import type { Document as DocumentType } from '@/lib/domains/documents';
import type { Invoice } from '@/lib/domains/invoices/types';
import type { Quote } from '@/lib/domains/quotes/types';

interface DocumentDeleteConfirmProps {
  document: DocumentType | Quote | Invoice;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

// API応答をそのまま扱うための型（必要な部分のみ）
interface InvoiceRelatedDataApi {
  canDelete: boolean;
  relatedData: {
    quote: {
      id: string;
      quoteNumber: string;
      status: string;
      statusLabel: string;
    } | null;
    conversionLog: {
      id: string;
      conversionDate: string;
      duplicatedItemsCount: number;
    } | null;
  };
  warnings: string[];
  blockers: string[];
}

interface QuoteRelatedDataApi {
  canDelete: boolean;
  relatedData: {
    invoices: Array<{
      id: string;
      invoiceNumber: string;
      status: string;
      statusLabel: string;
      issueDate: string;
    }>;
    conversionLogs: Array<{
      id: string;
      conversionDate: string;
      invoiceId?: string;
      invoiceNumber?: string;
      invoiceStatus?: string;
    }>;
  };
  warnings: string[];
  blockers: string[];
}

export function DocumentDeleteConfirm({
  document: documentData,
  onConfirm,
  onCancel,
}: DocumentDeleteConfirmProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();
  const [invoiceApi, setInvoiceApi] = useState<InvoiceRelatedDataApi | null>(
    null
  );
  const [quoteApi, setQuoteApi] = useState<QuoteRelatedDataApi | null>(null);
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);
  const [relatedDataError, setRelatedDataError] = useState<string>();

  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const isQuoteDocument =
    'expiryDate' in documentData && !('dueDate' in documentData);
  const documentType = isQuoteDocument ? '見積書' : '請求書';
  const documentNumber = isQuoteDocument
    ? (documentData as Quote).quoteNumber
    : (documentData as Invoice).invoiceNumber;

  // 関連データを取得
  useEffect(() => {
    const fetchRelatedData = async () => {
      try {
        setIsLoadingRelated(true);
        setRelatedDataError(undefined);

        const endpoint = isQuoteDocument
          ? `/api/quotes/${documentData.id}/related-data`
          : `/api/invoices/${documentData.id}/related-data`;

        const response = await fetch(endpoint);

        if (response.ok) {
          const payload = await response.json();
          if (isQuoteDocument) {
            setQuoteApi((payload.data as QuoteRelatedDataApi) ?? payload.data);
          } else {
            setInvoiceApi(
              (payload.data as InvoiceRelatedDataApi) ?? payload.data
            );
          }
        } else {
          throw new Error('関連データの取得に失敗しました');
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : '関連データの取得に失敗しました';
        setRelatedDataError(message);
        // エラーが発生した場合もデフォルト値を設定
        setInvoiceApi(null);
        setQuoteApi(null);
      } finally {
        setIsLoadingRelated(false);
      }
    };

    void fetchRelatedData();
  }, [documentData.id, isQuoteDocument]);

  // フォーカス管理
  useEffect(() => {
    // モーダル表示時にフォーカスを設定
    setTimeout(() => {
      cancelButtonRef.current?.focus();
    }, 100);

    // 背景スクロール無効化
    const originalOverflow = window.document.body.style.overflow;
    window.document.body.style.overflow = 'hidden';

    return () => {
      window.document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Escキーでキャンセル
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeleting) {
        onCancel();
      }
    };

    window.document.addEventListener('keydown', handleEscapeKey);
    return () => {
      window.document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isDeleting, onCancel]);

  // Tabキーのフォーカストラップ
  useEffect(() => {
    if (!dialogRef.current) return;

    const focusableElements = dialogRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      // フォーカス可能な要素が1つだけの場合
      if (focusableElements.length === 1) {
        e.preventDefault();
        return;
      }

      if (e.shiftKey) {
        if (window.document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (window.document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    window.document.addEventListener('keydown', handleTab);
    return () => window.document.removeEventListener('keydown', handleTab);
  }, []);

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      setDeleteError(undefined);

      await onConfirm();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `${documentType}の削除に失敗しました`;

      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = useCallback(() => {
    if (!isDeleting) {
      onCancel();
    }
  }, [isDeleting, onCancel]);

  // 削除可能性の判定（関連データ取得失敗時は安全のため無効化）
  const canDelete = relatedDataError
    ? false
    : isQuoteDocument
      ? (quoteApi?.canDelete ?? false)
      : (invoiceApi?.canDelete ?? false);
  const warnings = isQuoteDocument
    ? (quoteApi?.warnings ?? [])
    : (invoiceApi?.warnings ?? []);
  const blockers = isQuoteDocument
    ? (quoteApi?.blockers ?? [])
    : (invoiceApi?.blockers ?? []);

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-confirm-title"
    >
      {/* 背景オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* ダイアログコンテンツ */}
      <div
        ref={dialogRef}
        className="relative w-full max-w-md bg-white rounded-lg shadow-xl"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <h2
              id="delete-confirm-title"
              className="text-lg font-semibold text-gray-900"
            >
              {documentType}の削除
            </h2>
          </div>

          <button
            onClick={handleCancel}
            disabled={isDeleting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
            aria-label="削除確認を閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-4">
          {isLoadingRelated ? (
            <div className="flex items-center justify-center py-4">
              <Spinner size="md" />
              <span className="ml-2 text-sm text-gray-600">
                関連データを確認中...
              </span>
            </div>
          ) : relatedDataError ? (
            <Card className="border-red-200 bg-red-50">
              <div className="p-3 flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-800">{relatedDataError}</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                以下の{documentType}を削除しようとしています：
              </p>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Trash2 className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-900">
                    {documentNumber}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  発行日:{' '}
                  {new Date(documentData.issueDate).toLocaleDateString('ja-JP')}
                </div>
                {documentData.client && (
                  <div className="text-sm text-gray-600">
                    取引先: {documentData.client.name}
                  </div>
                )}
              </div>

              {/* エラー表示 */}
              {deleteError && (
                <Card className="border-red-200 bg-red-50">
                  <div className="p-3 flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-800">{deleteError}</p>
                  </div>
                </Card>
              )}

              {/* 削除阻害要因表示（赤系） */}
              {blockers.length > 0 && (
                <Card className="border-red-300 bg-red-50">
                  <div className="p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-800">
                        削除できない理由
                      </span>
                    </div>
                    <ul className="list-disc list-inside ml-2 text-sm text-red-700">
                      {blockers.map((blocker, i) => (
                        <li key={i}>{blocker}</li>
                      ))}
                    </ul>
                  </div>
                </Card>
              )}

              {/* 警告表示（黄系） */}
              {warnings.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <div className="p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">
                        注意事項
                      </span>
                    </div>
                    <ul className="list-disc list-inside ml-2 text-sm text-yellow-700">
                      {warnings.map((warning, i) => (
                        <li key={i}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </Card>
              )}

              <p className="text-sm text-gray-600">
                <strong>この操作は取り消すことができません。</strong>
                本当に削除しますか？
              </p>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50">
          <Button
            ref={cancelButtonRef}
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting || isLoadingRelated}
          >
            キャンセル
          </Button>

          <Button
            ref={confirmButtonRef}
            type="button"
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={isDeleting || isLoadingRelated || !canDelete}
            className="flex items-center space-x-2"
          >
            {isDeleting ? (
              <>
                <Spinner size="sm" />
                <span>削除中...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>削除する</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  // React Portal を使用してbody直下にレンダリング（SSR対応）
  if (typeof window === 'undefined') return null;
  return createPortal(modalContent, window.document.body);
}
