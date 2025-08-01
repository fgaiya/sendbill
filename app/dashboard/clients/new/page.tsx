import { Metadata } from 'next';

import { ClientForm } from '@/components/domains/clients';

export const metadata: Metadata = {
  title: '新規取引先登録 | SendBill',
  description: '新しい取引先を登録します',
};

export default function NewClientPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="sr-only">新規取引先登録</h1>
        <ClientForm />
      </div>
    </main>
  );
}
