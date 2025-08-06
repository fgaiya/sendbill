import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { Client } from '@/lib/domains/clients/types';
import { formatDate } from '@/lib/shared/utils/date';

import { ClientDeleteButton } from './ClientDeleteButton';

interface ClientListCardsProps {
  clients: Client[];
  isLoading: boolean;
  onClientDeleted?: () => void;
}

export function ClientListCards({
  clients,
  isLoading,
  onClientDeleted,
}: ClientListCardsProps) {
  if (isLoading) {
    return (
      <div className="md:hidden space-y-4">
        {[...Array(5)].map((_, index) => (
          <Card key={index} className="p-4 animate-pulse">
            <div className="space-y-3">
              <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="md:hidden space-y-4">
      {clients.map((client) => (
        <Card key={client.id} className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {client.name}
              </h3>
              <div className="flex items-center gap-2 text-sm font-medium whitespace-nowrap ml-2">
                <Link
                  href={`/dashboard/clients/${client.id}`}
                  className="text-blue-600 hover:text-blue-900 transition-colors"
                >
                  詳細
                </Link>
                <span className="text-gray-300">|</span>
                <Link
                  href={`/dashboard/clients/${client.id}/edit`}
                  className="text-green-600 hover:text-green-900 transition-colors"
                >
                  編集
                </Link>
                <span className="text-gray-300">|</span>
                <ClientDeleteButton
                  client={client}
                  onDeleteSuccess={onClientDeleted}
                  asTextLink={true}
                />
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {client.contactName && (
                <div className="flex items-center">
                  <span className="text-gray-500 w-16 shrink-0">担当者:</span>
                  <span className="text-gray-900">{client.contactName}</span>
                </div>
              )}

              {(client.contactEmail || client.phone) && (
                <div className="flex items-start">
                  <span className="text-gray-500 w-16 shrink-0">連絡先:</span>
                  <div className="text-gray-900">
                    {client.contactEmail && (
                      <div className="break-all">{client.contactEmail}</div>
                    )}
                    {client.phone && <div>{client.phone}</div>}
                  </div>
                </div>
              )}

              {client.address && (
                <div className="flex items-start">
                  <span className="text-gray-500 w-16 shrink-0">住所:</span>
                  <span className="text-gray-900 break-all">
                    {client.address}
                  </span>
                </div>
              )}

              <div className="flex items-center">
                <span className="text-gray-500 w-16 shrink-0">登録日:</span>
                <span className="text-gray-900">
                  {formatDate(client.createdAt) || '不正な日付'}
                </span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
