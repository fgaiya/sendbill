import { Metadata } from 'next';

import { ClientEditForm } from '@/components/domains/clients';

type ClientEditPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: '取引先編集 | SendBill',
  description: '取引先の情報を編集します',
};

export default async function ClientEditPage({ params }: ClientEditPageProps) {
  const { id } = await params;
  return <ClientEditForm clientId={id} />;
}
