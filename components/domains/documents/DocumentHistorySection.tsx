'use client';

import { useState, useEffect, useMemo } from 'react';

import Link from 'next/link';

import {
  FileText,
  Edit3,
  Trash2,
  Send,
  CheckCircle,
  ArrowRightCircle,
  User,
  Calendar,
  Info,
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import type { Document as DocumentType } from '@/lib/domains/documents';
import type { Invoice } from '@/lib/domains/invoices/types';
import type { Quote } from '@/lib/domains/quotes/types';
import { formatDateTime, cn } from '@/lib/shared/utils';

interface DocumentHistoryItem {
  id: string;
  action: 'create' | 'update' | 'delete' | 'status_change' | 'send' | 'convert';
  timestamp: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  description: string;
  details?: {
    oldValue?: unknown;
    newValue?: unknown;
    fieldName?: string;
    statusFrom?: string;
    statusTo?: string;
    convertedToId?: string;
    convertedToType?: 'quote' | 'invoice';
    convertedToNumber?: string;
  };
  metadata?: Record<string, unknown>;
}

interface DocumentHistorySectionProps {
  document: DocumentType | Quote | Invoice;
  className?: string;
}

export function DocumentHistorySection({
  document,
  className,
}: DocumentHistorySectionProps) {
  const [history, setHistory] = useState<DocumentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  // 機密情報をサニタイズして表示用文字列に変換
  const sanitizeValue = (value: unknown): string => {
    if (typeof value === 'object' && value !== null) {
      // 機密フィールドを除外
      const sanitized = { ...value } as Record<string, unknown>;
      const sensitiveKeys = [
        'password',
        'token',
        'secret',
        'apiKey',
        'key',
        'auth',
        'credential',
        'jwt',
      ];
      sensitiveKeys.forEach((key) => {
        if (key in sanitized) {
          sanitized[key] = '***';
        }
      });
      return JSON.stringify(sanitized, null, 2);
    }
    return String(value);
  };
  const [q, setQ] = useState('');
  const [actionFilter, setActionFilter] = useState<
    DocumentHistoryItem['action'] | 'all'
  >('all');

  const isQuoteDocument = 'expiryDate' in document && !('dueDate' in document);
  const documentType = isQuoteDocument ? '見積書' : '請求書';

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setError(undefined);

        // API エンドポイントを構築
        const endpoint = isQuoteDocument
          ? `/api/quotes/${document.id}/history`
          : `/api/invoices/${document.id}/history`;

        const response = await fetch(endpoint);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`${documentType}が見つかりません`);
          }
          let errorMessage = '操作履歴の取得に失敗しました';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // JSON以外のレスポンスの場合はデフォルトメッセージを使用
          }
          throw new Error(errorMessage);
        }

        const responseData = await response.json();
        setHistory(responseData.data || []);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '操作履歴の取得に失敗しました';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchHistory();
  }, [document.id, isQuoteDocument, documentType]);

  // アクション別のアイコンと色を取得
  const getActionIcon = (action: DocumentHistoryItem['action']) => {
    switch (action) {
      case 'create':
        return <FileText className="w-4 h-4 text-green-600" />;
      case 'update':
        return <Edit3 className="w-4 h-4 text-blue-600" />;
      case 'delete':
        return <Trash2 className="w-4 h-4 text-red-600" />;
      case 'send':
        return <Send className="w-4 h-4 text-purple-600" />;
      case 'status_change':
        return <CheckCircle className="w-4 h-4 text-orange-600" />;
      case 'convert':
        return <ArrowRightCircle className="w-4 h-4 text-indigo-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  // アクション別の背景色を取得
  const getActionBgColor = (action: DocumentHistoryItem['action']) => {
    switch (action) {
      case 'create':
        return 'bg-green-50 border-green-200';
      case 'update':
        return 'bg-blue-50 border-blue-200';
      case 'delete':
        return 'bg-red-50 border-red-200';
      case 'send':
        return 'bg-purple-50 border-purple-200';
      case 'status_change':
        return 'bg-orange-50 border-orange-200';
      case 'convert':
        return 'bg-indigo-50 border-indigo-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  // フィルター後の一覧
  const filtered = useMemo(() => {
    return history.filter((item) => {
      if (actionFilter !== 'all' && item.action !== actionFilter) return false;
      if (!q.trim()) return true;
      const t =
        `${item.description} ${item.userName || ''} ${item.userEmail || ''}`.toLowerCase();
      return t.includes(q.toLowerCase());
    });
  }, [history, q, actionFilter]);

  if (isLoading) {
    return (
      <Card className={cn('p-6', className)}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">操作履歴</h2>
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('p-6', className)}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">操作履歴</h2>
        <p className="text-red-600 text-center py-8">{error}</p>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6', className)}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">操作履歴</h2>
      {/* フィルター */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="履歴を検索"
          className="border rounded px-2 py-1 text-sm"
          aria-label="履歴検索"
        />
        <select
          value={actionFilter}
          onChange={(e) =>
            setActionFilter(
              e.target.value as DocumentHistoryItem['action'] | 'all'
            )
          }
          className="border rounded px-2 py-1 text-sm"
          aria-label="アクションで絞り込み"
        >
          <option value="all">すべて</option>
          <option value="create">作成</option>
          <option value="update">更新</option>
          <option value="delete">削除</option>
          <option value="status_change">ステータス変更</option>
          <option value="send">送信</option>
          <option value="convert">変換</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-8">操作履歴がありません</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={cn(
                'border rounded-lg p-4',
                getActionBgColor(item.action)
              )}
            >
              {/* ヘッダー情報 */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getActionIcon(item.action)}
                  <div>
                    <div className="font-medium text-gray-900">
                      {item.description}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <User className="w-3 h-3" />
                      <span>
                        {item.userName || item.userEmail || 'システム'}
                      </span>
                      <Calendar className="w-3 h-3 ml-2" />
                      <span>{formatDateTime(item.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 詳細情報 */}
              {item.details && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  {/* ステータス変更の場合 */}
                  {item.action === 'status_change' &&
                    item.details.statusFrom &&
                    item.details.statusTo && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <dt className="font-medium text-gray-500">変更前</dt>
                          <dd className="text-gray-900 mt-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {item.details.statusFrom}
                            </span>
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium text-gray-500">変更後</dt>
                          <dd className="text-gray-900 mt-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {item.details.statusTo}
                            </span>
                          </dd>
                        </div>
                      </div>
                    )}

                  {/* 変換の場合 */}
                  {item.action === 'convert' && item.details.convertedToId && (
                    <div className="text-sm">
                      <dt className="font-medium text-gray-500 mb-2">変換先</dt>
                      <dd className="text-gray-900">
                        <Link
                          href={`/dashboard/${item.details.convertedToType === 'quote' ? 'quotes' : 'invoices'}/${item.details.convertedToId}`}
                          className="text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                        >
                          <FileText className="w-4 h-4" />
                          {item.details.convertedToType === 'quote'
                            ? '見積書'
                            : '請求書'}
                          : {item.details.convertedToNumber || '(下書き)'}
                        </Link>
                      </dd>
                    </div>
                  )}

                  {/* フィールド変更の場合 */}
                  {item.action === 'update' && item.details.fieldName && (
                    <div className="text-sm">
                      <dt className="font-medium text-gray-500 mb-2">
                        変更フィールド
                      </dt>
                      <dd className="text-gray-900">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {item.details.fieldName}
                        </span>
                      </dd>

                      {item.details.oldValue !== undefined &&
                        item.details.newValue !== undefined && (
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                              <dt className="font-medium text-gray-500 text-xs">
                                変更前
                              </dt>
                              <dd className="text-gray-900 text-sm mt-1 font-mono bg-red-50 p-2 rounded">
                                {sanitizeValue(item.details.oldValue)}
                              </dd>
                            </div>
                            <div>
                              <dt className="font-medium text-gray-500 text-xs">
                                変更後
                              </dt>
                              <dd className="text-gray-900 text-sm mt-1 font-mono bg-green-50 p-2 rounded">
                                {sanitizeValue(item.details.newValue)}
                              </dd>
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}

              {/* メタデータ */}
              {item.metadata && Object.keys(item.metadata).length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <details className="group">
                    <summary className="text-sm font-medium text-gray-500 cursor-pointer hover:text-gray-700">
                      詳細情報を表示
                    </summary>
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto">
                      <pre>{sanitizeValue(item.metadata)}</pre>
                    </div>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
