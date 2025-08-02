import { Metadata } from 'next';

import { ClientList } from '@/components/domains/clients';

export const metadata: Metadata = {
  title: '取引先一覧 | SendBill',
  description: '登録されている取引先の一覧を表示・管理します',
};

export default function ClientsPage() {
  return <ClientList />;
}
