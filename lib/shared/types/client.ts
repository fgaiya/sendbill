/**
 * 取引先関連の共有型定義
 */

// 取引先データ型（APIレスポンス）
export interface Client {
  id: string;
  companyId: string;
  name: string;
  contactName?: string;
  contactEmail?: string;
  address?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
