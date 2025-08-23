'use client';

import Link from 'next/link';

import { FileText, Receipt, Eye } from 'lucide-react';

import type { Document } from '@/lib/domains/documents/types';
import {
  isQuote,
  getDocumentNumber,
  getDocumentEditUrl,
  calculateDocumentTotal,
} from '@/lib/domains/documents/types';
import { formatDate } from '@/lib/shared/utils/date';

import { DocumentActions } from './DocumentActions';
import { DocumentStatusBadge } from './DocumentStatusBadge';

interface DocumentListTableProps {
  documents: Document[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  selectedDocuments: Set<string>;
  toggleSelectDocument: (documentId: string) => void;
  selectAllDocuments: () => void;
  clearSelection: () => void;
  onOpenDetail: (document: Document) => void;
}

export function DocumentListTable({
  documents,
  isLoading,
  onRefresh,
  selectedDocuments,
  toggleSelectDocument,
  selectAllDocuments,
  clearSelection,
  onOpenDetail,
}: DocumentListTableProps) {
  // 詳細表示はクライアントサイドのモーダルで行う

  if (isLoading) {
    return (
      <div className="hidden md:block">
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300 border-separate [border-spacing:0]">
            <thead className="bg-gray-50 [&>tr>th:first-child]:rounded-tl-lg [&>tr>th:last-child]:rounded-tr-lg">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={
                      selectedDocuments.size > 0 &&
                      selectedDocuments.size === documents.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        selectAllDocuments();
                      } else {
                        clearSelection();
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  種別
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  番号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  取引先
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  金額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  発行日
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="px-6 py-4">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden md:block">
      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300 border-separate [border-spacing:0]">
          <thead className="bg-gray-50 [&>tr>th:first-child]:rounded-tl-lg [&>tr>th:last-child]:rounded-tr-lg">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                <input
                  type="checkbox"
                  checked={
                    selectedDocuments.size > 0 &&
                    selectedDocuments.size === documents.length
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      selectAllDocuments();
                    } else {
                      clearSelection();
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                種別
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                番号
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                取引先
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                金額
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ステータス
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                発行日
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {documents.map((document) => {
              const total = calculateDocumentTotal(document);
              const documentNumber = getDocumentNumber(document);
              const editUrl = getDocumentEditUrl(document);

              return (
                <tr
                  key={`${document.documentType}-${document.id}`}
                  className="hover:bg-gray-50 transition-colors duration-150 border-b border-gray-200 last:border-0 [&>td:first-child]:rounded-bl-lg [&>td:last-child]:rounded-br-lg"
                >
                  {/* 選択チェックボックス */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.has(document.id)}
                      onChange={() => toggleSelectDocument(document.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  {/* 種別 */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {isQuote(document) ? (
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="text-sm font-medium text-blue-700">
                            見積書
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Receipt className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-sm font-medium text-green-700">
                            請求書
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 番号 - クリックでモーダル表示 */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onOpenDetail(document)}
                      className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      {documentNumber}
                    </button>
                  </td>

                  {/* 取引先 */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {document.client?.name || '取引先未設定'}
                    </div>
                  </td>

                  {/* 金額 */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {new Intl.NumberFormat('ja-JP', {
                        style: 'currency',
                        currency: 'JPY',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(total.totalAmount)}
                    </div>
                  </td>

                  {/* ステータス */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <DocumentStatusBadge
                      document={document}
                      onRefresh={onRefresh}
                    />
                  </td>

                  {/* 発行日 */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(document.issueDate)}
                    </div>
                  </td>

                  {/* 操作 */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => onOpenDetail(document)}
                        className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                        title="詳細をモーダルで表示"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        詳細
                      </button>
                      <Link
                        href={editUrl}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        編集
                      </Link>
                      <DocumentActions
                        document={document}
                        onRefresh={onRefresh}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
