'use client';

import { useDocumentList } from '@/lib/domains/documents/hooks';

import { DocumentListError } from './DocumentListError';
import { DocumentListView } from './DocumentListView';

export function DocumentListContainer() {
  const { state, actions, params } = useDocumentList();
  const { error } = state;

  if (error) {
    return <DocumentListError error={error} />;
  }

  return <DocumentListView state={state} actions={actions} params={params} />;
}
