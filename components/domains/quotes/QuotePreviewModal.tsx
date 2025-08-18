'use client';

import { useEffect, useRef } from 'react';

import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

import { QuotePreview, type QuotePreviewProps } from './QuotePreview';

interface QuotePreviewModalProps extends QuotePreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 全画面見積書プレビューモーダル
 * React Portal + A11y対応（フォーカストラップ、キーボード操作）
 */
export function QuotePreviewModal({
  isOpen,
  onClose,
  ...previewProps
}: QuotePreviewModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // モーダル表示時のフォーカス管理
  useEffect(() => {
    if (isOpen) {
      // 背景スクロール固定
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // フォーカスを閉じるボタンに移動
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);

      // 背景要素にaria-hiddenを付与
      const mainElement = document.querySelector('main');
      if (mainElement) {
        mainElement.setAttribute('aria-hidden', 'true');
      }

      return () => {
        // クリーンアップ
        document.body.style.overflow = originalOverflow;
        if (mainElement) {
          mainElement.removeAttribute('aria-hidden');
        }
      };
    }
  }, [isOpen]);

  // Escキーで閉じる
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
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
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 print:p-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quote-preview-title"
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
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden print:max-w-none print:max-h-none print:shadow-none print:rounded-none print:w-auto print:h-auto"
      >
        {/* ヘッダー（印刷時非表示） */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 print:hidden">
          <h2
            id="quote-preview-title"
            className="text-lg font-semibold text-gray-900"
          >
            見積書プレビュー
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="プレビューを閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* プレビューコンテンツ */}
        <div className="overflow-auto max-h-[calc(90vh-4rem)] print:overflow-visible print:max-h-none">
          <QuotePreview {...previewProps} className="m-4 print:m-0" />
        </div>

        {/* フッター（印刷時非表示） */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 print:hidden">
          <div className="text-sm text-gray-600">
            印刷するには Ctrl+P (Cmd+P) を押してください
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );

  // React Portal を使用してbody直下にレンダリング
  return createPortal(modalContent, document.body);
}
