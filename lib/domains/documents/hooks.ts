'use client';

import { useState, useEffect, useCallback } from 'react';

import type { Invoice } from '@/lib/domains/invoices/types';
import type { Quote } from '@/lib/domains/quotes/types';

import { isQuote } from './types';

import type {
  Document,
  DocumentType,
  DocumentListParams,
  DocumentSortOption,
} from './types';

/**
 * 統合一覧フックの状態型
 */
export interface UseDocumentListState {
  documents: Document[];
  isLoading: boolean;
  error?: string;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: {
    quotesCount: number;
    invoicesCount: number;
    totalCount: number;
  };
  selectedDocuments: Set<string>;
}

/**
 * 統合一覧フックのアクション型
 */
export interface UseDocumentListActions {
  fetchDocuments: (newParams?: DocumentListParams) => Promise<void>;
  setPage: (page: number) => void;
  setSort: (sort: DocumentSortOption) => void;
  setSearch: (q: string) => void;
  setTypeFilter: (type: DocumentType | 'all' | undefined) => void;
  setStatusFilter: (status: string | undefined) => void;
  setClientFilter: (clientId: string | undefined) => void;
  setDateFilter: (dateFrom?: string, dateTo?: string) => void;
  refresh: () => Promise<void>;
  toggleSelectDocument: (documentId: string) => void;
  selectAllDocuments: () => void;
  clearSelection: () => void;
  bulkDelete: (documentIds: string[]) => Promise<{
    deletedCount: number;
    failedCount: number;
    total: number;
  }>;
}

/**
 * 統合一覧フックのリターン型
 */
export interface UseDocumentListReturn {
  state: UseDocumentListState;
  actions: UseDocumentListActions;
  params: DocumentListParams;
}

/**
 * 見積書・請求書統合一覧フック
 */
export function useDocumentList(
  initialParams: DocumentListParams = {}
): UseDocumentListReturn {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(
    new Set()
  );
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [summary, setSummary] = useState({
    quotesCount: 0,
    invoicesCount: 0,
    totalCount: 0,
  });

  const [params, setParams] = useState<DocumentListParams>({
    page: 1,
    limit: 20,
    type: 'all',
    ...initialParams,
  });

  /**
   * 見積書と請求書を並行取得して統合
   */
  const fetchDocuments = useCallback(
    async (newParams?: DocumentListParams) => {
      setIsLoading(true);
      setError(undefined);

      try {
        const finalParams = { ...params, ...newParams };

        // 見積書と請求書を並行取得
        const [quotesResponse, invoicesResponse] = await Promise.allSettled([
          fetchQuotes(finalParams),
          fetchInvoices(finalParams),
        ]);

        let quotes: Quote[] = [];
        let invoices: Invoice[] = [];

        // 見積書データの処理
        if (quotesResponse.status === 'fulfilled') {
          quotes = quotesResponse.value.data;
        }

        // 請求書データの処理
        if (invoicesResponse.status === 'fulfilled') {
          invoices = invoicesResponse.value.data;
        }

        // データを統合
        const combinedDocuments = combineAndSort(quotes, invoices, finalParams);

        // ページネーション計算
        const totalCount = combinedDocuments.length;
        const page = finalParams.page || 1;
        const limit = finalParams.limit || 20;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedDocuments = combinedDocuments.slice(
          startIndex,
          endIndex
        );

        setDocuments(paginatedDocuments);
        setPagination({
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        });
        setSummary({
          quotesCount: quotes.length,
          invoicesCount: invoices.length,
          totalCount: quotes.length + invoices.length,
        });

        // パラメータを更新
        if (newParams) {
          setParams(finalParams);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '帳票の取得に失敗しました';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [params]
  );

  /**
   * 見積書データ取得
   */
  const fetchQuotes = async (params: DocumentListParams) => {
    if (params.type === 'invoice') {
      return { data: [] };
    }

    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', '1'); // 全件取得
    if (params.limit) searchParams.set('limit', '1000'); // 大きな値で全件取得
    if (params.q) searchParams.set('q', params.q);
    if (params.status) searchParams.set('status', params.status);
    if (params.clientId) searchParams.set('clientId', params.clientId);
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.set('dateTo', params.dateTo);
    searchParams.set('include', 'client,items');

    const response = await fetch(`/api/quotes?${searchParams.toString()}`);
    if (!response.ok) {
      throw new Error('見積書の取得に失敗しました');
    }
    return await response.json();
  };

  /**
   * 請求書データ取得
   */
  const fetchInvoices = async (params: DocumentListParams) => {
    if (params.type === 'quote') {
      return { data: [] };
    }

    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', '1');
    if (params.limit) searchParams.set('limit', '1000');
    if (params.q) searchParams.set('q', params.q);
    if (params.status) searchParams.set('status', params.status);
    if (params.clientId) searchParams.set('clientId', params.clientId);
    if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) searchParams.set('dateTo', params.dateTo);
    searchParams.set('include', 'client,items');

    const response = await fetch(`/api/invoices?${searchParams.toString()}`);
    if (!response.ok) {
      throw new Error('請求書の取得に失敗しました');
    }
    return await response.json();
  };

  /**
   * データを統合してソート
   */
  const combineAndSort = (
    quotes: Quote[],
    invoices: Invoice[],
    params: DocumentListParams
  ): Document[] => {
    // 見積書にdocumentTypeを追加
    const quoteDocs: Document[] = quotes.map((quote) => ({
      ...quote,
      documentType: 'quote' as const,
    }));

    // 請求書にdocumentTypeを追加
    const invoiceDocs: Document[] = invoices.map((invoice) => ({
      ...invoice,
      documentType: 'invoice' as const,
    }));

    // 統合
    const combined = [...quoteDocs, ...invoiceDocs];

    // ソート（デフォルトは作成日の降順）
    return combined.sort((a, b) => {
      const sort = params.sort || 'createdAt_desc';

      switch (sort) {
        case 'createdAt_desc':
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case 'createdAt_asc':
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case 'issueDate_desc':
          return (
            new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
          );
        case 'issueDate_asc':
          return (
            new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime()
          );
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });
  };

  // アクション関数群
  const setPage = useCallback(
    (page: number) => {
      fetchDocuments({ page });
    },
    [fetchDocuments]
  );

  const setSort = useCallback(
    (sort: DocumentSortOption) => {
      fetchDocuments({ sort, page: 1 });
    },
    [fetchDocuments]
  );

  const setSearch = useCallback(
    (q: string) => {
      fetchDocuments({ q, page: 1 });
    },
    [fetchDocuments]
  );

  const setTypeFilter = useCallback(
    (type: DocumentType | 'all' | undefined) => {
      fetchDocuments({ type, page: 1 });
    },
    [fetchDocuments]
  );

  const setStatusFilter = useCallback(
    (status: string | undefined) => {
      fetchDocuments({ status, page: 1 });
    },
    [fetchDocuments]
  );

  const setClientFilter = useCallback(
    (clientId: string | undefined) => {
      fetchDocuments({ clientId, page: 1 });
    },
    [fetchDocuments]
  );

  const setDateFilter = useCallback(
    (dateFrom?: string, dateTo?: string) => {
      fetchDocuments({ dateFrom, dateTo, page: 1 });
    },
    [fetchDocuments]
  );

  const refresh = useCallback(() => {
    return fetchDocuments();
  }, [fetchDocuments]);

  // 一括操作関数
  const toggleSelectDocument = useCallback((documentId: string) => {
    setSelectedDocuments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  }, []);

  const selectAllDocuments = useCallback(() => {
    setSelectedDocuments(new Set(documents.map((doc) => doc.id)));
  }, [documents]);

  const clearSelection = useCallback(() => {
    setSelectedDocuments(new Set());
  }, []);

  const bulkDelete = useCallback(
    async (documentIds: string[]) => {
      setIsLoading(true);
      try {
        const results = await Promise.allSettled(
          documentIds.map(async (id) => {
            const document = documents.find((doc) => doc.id === id);
            if (!document) throw new Error(`Document ${id} not found`);

            const apiPath = isQuote(document)
              ? `/api/quotes/${id}`
              : `/api/invoices/${id}`;

            const response = await fetch(apiPath, { method: 'DELETE' });
            if (!response.ok) {
              throw new Error(`Failed to delete ${id}`);
            }
            return id;
          })
        );

        const deletedIds = results
          .filter(
            (result): result is PromiseFulfilledResult<string> =>
              result.status === 'fulfilled'
          )
          .map((result) => result.value);

        const failedCount = results.filter(
          (result) => result.status === 'rejected'
        ).length;

        if (deletedIds.length > 0) {
          clearSelection();
          await refresh();
        }

        return {
          deletedCount: deletedIds.length,
          failedCount,
          total: documentIds.length,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [documents, clearSelection, refresh]
  );

  // 初回読み込み
  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  return {
    state: {
      documents,
      isLoading,
      error,
      pagination,
      summary,
      selectedDocuments,
    },
    actions: {
      fetchDocuments,
      setPage,
      setSort,
      setSearch,
      setTypeFilter,
      setStatusFilter,
      setClientFilter,
      setDateFilter,
      refresh,
      toggleSelectDocument,
      selectAllDocuments,
      clearSelection,
      bulkDelete,
    },
    params,
  };
}
