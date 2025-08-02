'use client';

import React from 'react';

import { useClientList } from '@/lib/domains/clients/hooks';

import { ClientListError } from './ClientListError';
import { ClientListView } from './ClientListView';

export function ClientListContainer() {
  const { state, actions, params } = useClientList();
  const { error } = state;

  if (error) {
    return <ClientListError error={error} />;
  }

  return <ClientListView state={state} actions={actions} params={params} />;
}
