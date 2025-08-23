'use client';

import { useEffect, useRef, useState } from 'react';

import { X, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

import {
  Document as DocumentType,
  getDocumentDetailUrl,
  getDocumentTypeName,
  isQuote,
} from '@/lib/domains/documents';

import { DocumentDeleteConfirm } from './DocumentDeleteConfirm';
import { DocumentDetailView } from './DocumentDetailView';
import { DocumentHistorySection } from './DocumentHistorySection';

interface DocumentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentType;
  onDelete?: (documentId: string) => void;
  canDelete?: boolean;
}

export function DocumentDetailModal({
  isOpen,
  onClose,
  document,
  onDelete,
  canDelete = true,
}: DocumentDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'detail' | 'history'>('detail');

  // モーダル表示時のフォーカス管理
  useEffect(() => {
    if (isOpen) {
      // 背景スクロール固定
      const originalOverflow = window.document.body.style.overflow;
      window.document.body.style.overflow = 'hidden';

      // フォーカスを閉じるボタンに移動
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
      // 背景要素をrefベースでinert化（aria-hidden）
      // body直下の子要素から、モーダルを含まない要素にaria-hiddenを付与
      const doc = modalRef.current?.ownerDocument;
      const bodyChildren = doc ? Array.from(doc.body.children) : [];
      const restored: Array<{
        el: Element;
        hadAttr: boolean;
        prev?: string | null;
      }> = [];
      for (const el of bodyChildren) {
        if (!modalRef.current) break;
        // elがモーダルコンテンツを包含していない場合のみ非表示化
        if (!el.contains(modalRef.current)) {
          restored.push({
            el,
            hadAttr: el.hasAttribute('aria-hidden'),
            prev: el.getAttribute('aria-hidden'),
          });
          el.setAttribute('aria-hidden', 'true');
        }
      }

      return () => {
        // クリーンアップ
        window.document.body.style.overflow = originalOverflow;
        // 付与したaria-hiddenを元に戻す
        for (const { el, hadAttr, prev } of restored) {
          if (!hadAttr) {
            el.removeAttribute('aria-hidden');
          } else if (prev != null) {
            el.setAttribute('aria-hidden', prev);
          }
        }
      };
    }
  }, [isOpen, document]);

  // Escキーで閉じる
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.document.addEventListener('keydown', handleEscape);
    return () => window.document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Tabキーのフォーカストラップ
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

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
  }, [isOpen, activeTab, document]);

  if (!isOpen) return null;

  const detailPageUrl = getDocumentDetailUrl(document);

  const handleDeleteConfirm = async () => {
    try {
      if (onDelete) {
        onDelete(document.id);
      } else {
        const isQuoteDoc = document.documentType === 'quote';
        const endpoint = isQuoteDoc
          ? `/api/quotes/${encodeURIComponent(String(document.id))}`
          : `/api/invoices/${encodeURIComponent(String(document.id))}`;
        const res = await fetch(endpoint, { method: 'DELETE' });
        if (!res.ok) {
          let msg = '削除に失敗しました';
          try {
            const j = await res.json();
            msg = j.error || j.message || msg;
          } catch (e) {
            console.error('Failed to parse error response:', e);
          }
          throw new Error(msg);
        }
      }

      // 成功時の処理
      const documentTypeName = getDocumentTypeName(document.documentType);
      const documentNumber = isQuote(document)
        ? document.quoteNumber || document.id
        : document.invoiceNumber || document.id;
      toast.success(`${documentTypeName}「${documentNumber}」を削除しました`);

      setIsDeleteConfirmOpen(false);
      onClose();
    } catch (error) {
      console.error('Delete operation failed:', error);
      const message =
        error instanceof Error ? error.message : '削除に失敗しました';
      toast.error(message);
      setIsDeleteConfirmOpen(false);
    }
  };

  const documentType = getDocumentTypeName(document.documentType);

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 print:p-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-detail-title"
    >
      {/* 背景オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/50 print:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* モーダルコンテンツ */}
      <div
        ref={modalRef}
        className="relative w-full max-w-6xl max-h-[95vh] bg-white rounded-lg shadow-xl overflow-hidden print:max-w-none print:max-h-none print:shadow-none print:rounded-none print:w-auto print:h-auto"
      >
        {/* ヘッダー（印刷時非表示） */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 print:hidden">
          <div className="flex items-center space-x-4">
            <h2
              id="document-detail-title"
              className="text-lg font-semibold text-gray-900"
            >
              {documentType}詳細
            </h2>

            {/* タブ切り替え */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('detail')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'detail'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                aria-pressed={activeTab === 'detail'}
              >
                詳細
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'history'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                aria-pressed={activeTab === 'history'}
              >
                履歴
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* 削除ボタン */}
            {canDelete && activeTab === 'detail' && (
              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                aria-label={`${documentType}を削除`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}

            {/* ページで開く */}
            <a
              href={detailPageUrl}
              className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
            >
              ページで開く
            </a>

            {/* 閉じるボタン */}
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="詳細を閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className="overflow-auto max-h-[calc(95vh-5rem)] print:overflow-visible print:max-h-none">
          {activeTab === 'detail' ? (
            <DocumentDetailView document={document} className="p-4" />
          ) : (
            <DocumentHistorySection document={document} className="p-4" />
          )}
        </div>

        {/* フッター（印刷時非表示） */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 print:hidden">
          <div className="text-sm text-gray-600">
            印刷や詳細編集はページで行えます
          </div>
          <div className="flex space-x-2">
            <a
              href={detailPageUrl}
              className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ページで開く
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      {isDeleteConfirmOpen && (
        <DocumentDeleteConfirm
          document={document}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setIsDeleteConfirmOpen(false)}
        />
      )}
    </div>
  );

  // React Portal を使用してbody直下にレンダリング
  return createPortal(modalContent, window.document.body);
}
