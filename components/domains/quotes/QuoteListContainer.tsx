'use client';

import { useQuoteList } from '@/lib/domains/quotes/hooks';

import { QuoteListError } from './QuoteListError';
import { QuoteListView } from './QuoteListView';

export function QuoteListContainer() {
  const { state, actions, params } = useQuoteList();
  const { error } = state;

  if (error) {
    return <QuoteListError error={error} />;
  }

  return <QuoteListView state={state} actions={actions} params={params} />;
}
