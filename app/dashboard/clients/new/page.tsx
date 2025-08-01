import { Metadata } from 'next';

import { ClientForm } from '@/components/domains/clients';

export const metadata: Metadata = {
  title: '新規取引先登録 | SendBill',
  description: '新しい取引先を登録します',
};

export default function NewClientPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold mb-6">新規取引先登録</h1>
      <ClientForm />
    </>
  );
}
