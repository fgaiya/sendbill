'use client';

import { useState } from 'react';

import {
  MoreVertical,
  Trash2,
  Copy,
  FileText,
  Receipt,
  ArrowRight,
  Printer,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Document } from '@/lib/domains/documents/types';
import { isQuote, getDocumentNumber } from '@/lib/domains/documents/types';
import { emitUsageRefresh } from '@/lib/shared/utils/usage-events';

interface DocumentActionsProps {
  document: Document;
  onRefresh: () => Promise<void>;
}

export function DocumentActions({ document, onRefresh }: DocumentActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const documentNumber = getDocumentNumber(document);
  const documentTypeName = isQuote(document) ? '見積書' : '請求書';

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const apiPath = isQuote(document)
        ? `/api/quotes/${document.id}`
        : `/api/invoices/${document.id}`;

      const response = await fetch(apiPath, {
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

      toast.success(`${documentTypeName}「${documentNumber}」を削除しました`);
      await onRefresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '削除に失敗しました';
      toast.error(message);
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      const apiPath = isQuote(document)
        ? `/api/quotes/${document.id}/duplicate`
        : `/api/invoices/${document.id}/duplicate`;

      const response = await fetch(apiPath, { method: 'POST' });
      if (!response.ok) {
        let errorMessage = '複製に失敗しました';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      const result = await response.json();
      toast.success(result.message || '複製しました');
      // 使用量の更新（複製も作成扱い）。ヘッダーがあればノーフェッチで即時反映。
      const parseNum = (raw: string | null): number | undefined => {
        if (raw == null) return undefined;
        const n = Number(raw);
        return Number.isFinite(n) ? n : undefined;
      };
      const parseBool = (raw: string | null): boolean | undefined => {
        if (raw == null) return undefined;
        const v = raw.trim().toLowerCase();
        if (v === 'true' || v === '1') return true;
        if (v === 'false' || v === '0') return false;
        return undefined;
      };
      const used = parseNum(response.headers.get('X-Usage-Used'));
      const remaining = parseNum(response.headers.get('X-Usage-Remaining'));
      const limit = parseNum(response.headers.get('X-Usage-Limit'));
      const warn = parseBool(response.headers.get('X-Usage-Warn'));
      emitUsageRefresh({ used, remaining, limit, warn });
      await onRefresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '複製に失敗しました';
      toast.error(message);
    }
  };

  const handleConvertToInvoice = async () => {
    if (!isQuote(document)) return;

    try {
      const response = await fetch(`/api/invoices/from-quote/${document.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // 全品目を選択して変換
          selectedItemIds: document.items?.map((item) => item.id) || [],
        }),
      });

      if (!response.ok) {
        let errorMessage = '変換に失敗しました';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON以外のレスポンスの場合はデフォルトメッセージを使用
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      toast.success(
        result.message ||
          `見積書「${getDocumentNumber(document)}」から請求書を作成しました`
      );
      // 使用量の更新（変換も作成扱い）。ヘッダーがあれば即時反映。
      {
        const parseNum = (raw: string | null): number | undefined => {
          if (raw == null) return undefined;
          const n = Number(raw);
          return Number.isFinite(n) ? n : undefined;
        };
        const parseBool = (raw: string | null): boolean | undefined => {
          if (raw == null) return undefined;
          const v = raw.trim().toLowerCase();
          if (v === 'true' || v === '1') return true;
          if (v === 'false' || v === '0') return false;
          return undefined;
        };
        const used = parseNum(response.headers.get('X-Usage-Used'));
        const remaining = parseNum(response.headers.get('X-Usage-Remaining'));
        const limit = parseNum(response.headers.get('X-Usage-Limit'));
        const warn = parseBool(response.headers.get('X-Usage-Warn'));
        emitUsageRefresh({ used, remaining, limit, warn });
      }

      // 成功後にリフレッシュ
      await onRefresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '変換に失敗しました';
      toast.error(message);
      console.error('Convert to invoice failed:', error);
    }
  };

  const handlePrintPreview = () => {
    const basePath = isQuote(document) ? 'quotes' : 'invoices';
    const url = `/dashboard/${basePath}/${document.id}/print`;
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    if (w) w.opener = null; // 逆タブナビング対策（ブラウザ差異への保険）
  };

  if (showDeleteConfirm) {
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
          onClick={() => setShowDeleteConfirm(false)}
          disabled={isDeleting}
          className="px-2 py-1 text-xs"
        >
          キャンセル
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">アクションメニューを開く</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* 印刷プレビュー */}
        <DropdownMenuItem onClick={handlePrintPreview}>
          <Printer className="mr-2 h-4 w-4" />
          印刷プレビュー
        </DropdownMenuItem>

        {/* 複製 */}
        <DropdownMenuItem onClick={handleDuplicate}>
          <Copy className="mr-2 h-4 w-4" />
          複製
        </DropdownMenuItem>

        {/* 見積書→請求書変換（見積書の場合のみ） */}
        {isQuote(document) && document.status === 'ACCEPTED' && (
          <DropdownMenuItem onClick={handleConvertToInvoice}>
            <div className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              <ArrowRight className="mr-1 h-3 w-3" />
              <Receipt className="mr-2 h-4 w-4" />
            </div>
            請求書に変換
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* 削除 */}
        <DropdownMenuItem
          onClick={() => setShowDeleteConfirm(true)}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          削除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
