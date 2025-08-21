import { DocumentList } from '@/components/domains/documents';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '帳票管理 - SendBill',
  description: '見積書・請求書を統合管理',
};

export default function DocumentsPage() {
  return <DocumentList />;
}
