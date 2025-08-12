'use client';

import React, { useState, useEffect } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Client } from '@/lib/shared/types';
import { formatDate } from '@/lib/shared/utils/date';

import { ClientDeleteButton } from './ClientDeleteButton';

interface ClientDetailProps {
  clientId: string;
}

export function ClientDetail({ clientId }: ClientDetailProps) {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const fetchClient = async () => {
      try {
        setIsLoading(true);
        setError(undefined);

        const response = await fetch(`/api/clients/${clientId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('取引先が見つかりません');
          }
          let errorMessage = '取引先の取得に失敗しました';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // JSON以外のレスポンスの場合はデフォルトメッセージを使用
          }
          throw new Error(errorMessage);
        }

        const clientData: Client = await response.json();
        setClient(clientData);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '取引先の取得に失敗しました';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchClient();
  }, [clientId]);

  const handleDeleteSuccess = () => {
    router.push('/dashboard/clients');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">エラー</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <Link href="/dashboard/clients">
            <Button>取引先一覧に戻る</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            取引先が見つかりません
          </h1>
          <p className="text-gray-600 mb-8">
            指定された取引先は存在しないか、削除されている可能性があります。
          </p>
          <Link href="/dashboard/clients">
            <Button>取引先一覧に戻る</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <nav className="flex items-center text-sm text-gray-500 mb-4">
          <Link
            href="/dashboard/clients"
            className="hover:text-gray-700 transition-colors"
          >
            取引先一覧
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{client.name}</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>

          <div className="flex gap-3">
            <Link href={`/dashboard/clients/${client.id}/edit`}>
              <Button variant="outline" size="sm">
                編集
              </Button>
            </Link>
            <ClientDeleteButton
              client={client}
              onDeleteSuccess={handleDeleteSuccess}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">
                取引先名
              </dt>
              <dd className="text-sm text-gray-900">{client.name}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">
                担当者名
              </dt>
              <dd className="text-sm text-gray-900">
                {client.contactName || '-'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">
                メールアドレス
              </dt>
              <dd className="text-sm text-gray-900">
                {client.contactEmail ? (
                  <a
                    href={`mailto:${client.contactEmail}`}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {client.contactEmail}
                  </a>
                ) : (
                  '-'
                )}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">
                電話番号
              </dt>
              <dd className="text-sm text-gray-900">
                {client.phone ? (
                  <a
                    href={`tel:${client.phone}`}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {client.phone}
                  </a>
                ) : (
                  '-'
                )}
              </dd>
            </div>

            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500 mb-1">住所</dt>
              <dd className="text-sm text-gray-900">{client.address || '-'}</dd>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            システム情報
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">登録日</dt>
              <dd className="text-sm text-gray-900">
                {formatDate(client.createdAt) || '不正な日付'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">
                最終更新日
              </dt>
              <dd className="text-sm text-gray-900">
                {formatDate(client.updatedAt) || '不正な日付'}
              </dd>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
