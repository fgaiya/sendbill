'use client';

import { useState } from 'react';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

interface InvoiceDeleteButtonProps {
  invoiceId: string;
  invoiceNumber: string;
  onDeleted?: () => void;
}

export function InvoiceDeleteButton({
  invoiceId,
  invoiceNumber,
  onDeleted,
}: InvoiceDeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        let errorMessage = '削除に失敗しました';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON以外のレスポンスの場合はデフォルトメッセージを使用
        }
        throw new Error(errorMessage);
      }

      toast.success(`請求書「${invoiceNumber}」を削除しました`);
      onDeleted?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '削除に失敗しました';
      toast.error(message);
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-2 py-1 text-xs"
        >
          {isDeleting ? '削除中...' : '削除'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="px-2 py-1 text-xs"
        >
          キャンセル
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => setShowConfirm(true)}
      className="text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 text-xs"
    >
      <Trash2 className="h-3 w-3" />
    </Button>
  );
}
