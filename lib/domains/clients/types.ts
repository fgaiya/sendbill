import { z } from 'zod';

import {
  PaginatedResponse,
  PaginationInfo,
  PaginationParams,
  SortField,
  SortParams,
} from '@/lib/shared/types';

import { clientSchemas } from './schemas';

import type { UseFormReturn } from 'react-hook-form';
/**
 * 取引先ドメイン型定義
 */

// 取引先フォームデータ型
export type ClientFormData = z.infer<typeof clientSchemas.create>;

// 取引先データ型（APIレスポンス）
export interface Client {
  id: string;
  name: string;
  contactName?: string;
  contactEmail?: string;
  address?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

// 取引先のソート可能フィールド
export type ClientSortField = 'name' | 'created';

// 取引先のソートオプション
export type ClientSortOption = SortField<ClientSortField>;

// 取引先一覧APIレスポンス型
export type ClientListResponse = PaginatedResponse<Client>;

// 取引先一覧の検索・ソートパラメータ
export interface ClientListParams
  extends PaginationParams,
    SortParams<ClientSortField> {
  q?: string;
}

// 取引先一覧の状態
export interface ClientListState {
  clients: Client[];
  isLoading: boolean;
  error?: string;
  pagination: PaginationInfo;
}

// 取引先一覧の操作
export interface ClientListActions {
  fetchClients: (params?: ClientListParams) => Promise<void>;
  setPage: (page: number) => void;
  setSort: (sort: ClientListParams['sort']) => void;
  setSearch: (query: string) => void;
  refresh: () => Promise<void>;
}

// useClientList フックの戻り値型
export interface UseClientListReturn {
  state: ClientListState;
  actions: ClientListActions;
  params: ClientListParams;
}

// フォーム送信状態
export interface ClientFormState {
  isSubmitting: boolean;
  submitError?: string;
  submitSuccess: boolean;
}

// フォーム操作
export interface ClientFormActions {
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onReset: () => void;
  clearMessages: () => void;
}

// useClientForm フックの戻り値型
export interface UseClientFormReturn {
  form: UseFormReturn<ClientFormData>;
  state: ClientFormState;
  actions: ClientFormActions;
}
