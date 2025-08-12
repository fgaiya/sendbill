'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useClientDelete } from '@/lib/domains/clients/hooks';
import { Client } from '@/lib/shared/types';

interface ClientDeleteButtonProps {
  client: Client;
  onDeleteSuccess?: () => void;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  asTextLink?: boolean;
}

export function ClientDeleteButton({
  client,
  onDeleteSuccess,
  size = 'sm',
  variant = 'outline',
  asTextLink = false,
}: ClientDeleteButtonProps) {
  const router = useRouter();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { deleteClient, isDeleting, deleteError, clearError } =
    useClientDelete();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const handleDeleteClick = () => {
    clearError();
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    const success = await deleteClient(client);

    if (success) {
      setShowConfirmDialog(false);

      // 成功トーストを表示
      toast.success(`「${client.name}」を削除しました`);

      // カスタムコールバックがある場合は実行、ない場合は取引先一覧にリダイレクト
      if (onDeleteSuccess) {
        onDeleteSuccess();
      } else {
        router.push('/dashboard/clients');
      }
    } else if (deleteError) {
      // エラートーストを表示
      toast.error(deleteError);
    }
    // エラーの場合はダイアログを開いたままにして、エラーメッセージを表示
  };

  const handleCancelDelete = useCallback(() => {
    clearError();
    setShowConfirmDialog(false);
  }, [clearError]);

  // ESCキーでダイアログを閉じる
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showConfirmDialog) {
        handleCancelDelete();
      }
    };

    if (showConfirmDialog) {
      document.addEventListener('keydown', handleEscapeKey);
      // フォーカスをキャンセルボタンに設定
      setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 0);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showConfirmDialog, handleCancelDelete]);

  // ダイアログが開いている間、背景のスクロールを無効化
  useEffect(() => {
    if (showConfirmDialog) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showConfirmDialog]);

  return (
    <>
      {asTextLink ? (
        <button
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className="text-red-600 hover:text-red-900 transition-colors disabled:text-red-400"
        >
          {isDeleting ? '削除中...' : '削除'}
        </button>
      ) : (
        <Button
          variant={variant}
          size={size}
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
        >
          {isDeleting ? (
            <>
              <Spinner size="sm" className="mr-2" />
              削除中...
            </>
          ) : (
            '削除'
          )}
        </Button>
      )}

      {/* 削除確認ダイアログ */}
      {showConfirmDialog && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleCancelDelete}
        >
          <div
            ref={dialogRef}
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3
                    id="delete-dialog-title"
                    className="text-lg font-medium text-gray-900"
                  >
                    取引先を削除
                  </h3>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  「
                  <span className="font-medium text-gray-900">
                    {client.name}
                  </span>
                  」を削除しようとしています。
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  この操作は元に戻すことができません。
                </p>
                <p className="text-sm text-red-600 font-medium">
                  関連する見積書や請求書がある場合は削除できません。
                </p>
                {deleteError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">{deleteError}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  ref={cancelButtonRef}
                  type="button"
                  variant="outline"
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                >
                  キャンセル
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      削除中...
                    </>
                  ) : (
                    '削除する'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
