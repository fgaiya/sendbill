import { Metadata } from 'next';

import { ClientDetail } from '@/components/domains/clients';

type ClientDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: '取引先詳細 | SendBill',
  description: '取引先の詳細情報と操作メニューを表示します',
};

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
  const { id } = await params;
  return <ClientDetail clientId={id} />;
}
