'use client';

import { useInvoiceList } from '@/lib/domains/invoices/hooks';

import { InvoiceListError } from './InvoiceListError';
import { InvoiceListView } from './InvoiceListView';

export function InvoiceListContainer() {
  const { state, actions, params } = useInvoiceList();
  const { error } = state;

  if (error) {
    return <InvoiceListError error={error} />;
  }

  return <InvoiceListView state={state} actions={actions} params={params} />;
}
