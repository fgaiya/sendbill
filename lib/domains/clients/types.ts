import { z } from 'zod';

import { clientSchemas } from './schemas';

import type { UseFormReturn } from 'react-hook-form';
/**
 * 取引先ドメイン型定義
 */

// 取引先フォームデータ型
export type ClientFormData = z.infer<typeof clientSchemas.create>;

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
