import { z } from 'zod';

import { clientSchemas } from './schemas';

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
  onSubmit: (data: ClientFormData) => Promise<void>;
  onReset: () => void;
  clearMessages: () => void;
}

// useClientForm フックの戻り値型
export interface UseClientFormReturn {
  form: ReturnType<typeof import('react-hook-form').useForm<ClientFormData>>;
  state: ClientFormState;
  actions: ClientFormActions;
}
