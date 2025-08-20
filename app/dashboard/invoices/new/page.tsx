import { InvoiceForm } from '@/components/domains/invoices/InvoiceForm';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '請求書作成 | SendBill',
  description: '新しい請求書を作成します',
};

export default function NewInvoicePage() {
  return <InvoiceForm />;
}
