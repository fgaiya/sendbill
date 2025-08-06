'use client';

import React, { useState, useEffect } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { BaseForm } from '@/components/ui/BaseForm';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ClientUpdateData, clientSchemas } from '@/lib/domains/clients/schemas';
import { Client } from '@/lib/domains/clients/types';

import { ClientFormFields } from './ClientFormFields';

interface ClientEditFormProps {
  clientId: string;
}

export function ClientEditForm({ clientId }: ClientEditFormProps) {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [submitError, setSubmitError] = useState<string>();
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm<ClientUpdateData>({
    resolver: zodResolver(clientSchemas.update),
    mode: 'onBlur',
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid, isDirty, isSubmitting },
  } = form;

  // 取引先データの取得と初期化
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

        // フォームの初期値を設定
        reset({
          name: clientData.name,
          contactName: clientData.contactName || '',
          contactEmail: clientData.contactEmail || '',
          address: clientData.address || '',
          phone: clientData.phone || '',
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '取引先の取得に失敗しました';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchClient();
  }, [clientId, reset]);

  const onSubmit = async (data: ClientUpdateData) => {
    try {
      setSubmitError(undefined);
      setSubmitSuccess(false);

      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        let errorMessage = '取引先の更新に失敗しました';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON以外のレスポンスの場合はデフォルトメッセージを使用
        }
        throw new Error(errorMessage);
      }

      setSubmitSuccess(true);

      router.push(`/dashboard/clients/${clientId}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '取引先の更新に失敗しました';
      setSubmitError(message);
    }
  };

  const onReset = () => {
    if (client) {
      reset({
        name: client.name,
        contactName: client.contactName || '',
        contactEmail: client.contactEmail || '',
        address: client.address || '',
        phone: client.phone || '',
      });
    }
    setSubmitError(undefined);
    setSubmitSuccess(false);
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <nav className="flex items-center text-sm text-gray-500 mb-8">
          <Link
            href="/dashboard/clients"
            className="hover:text-gray-700 transition-colors"
          >
            取引先一覧
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/dashboard/clients/${client.id}`}
            className="hover:text-gray-700 transition-colors"
          >
            {client.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">編集</span>
        </nav>

        <BaseForm
          title={`${client.name} の編集`}
          description="取引先の情報を更新してください"
          onSubmit={handleSubmit(onSubmit)}
          onReset={onReset}
          isSubmitting={isSubmitting}
          isValid={isValid}
          submitError={submitError}
          submitSuccess={submitSuccess}
          successMessage="取引先が正常に更新されました！"
          submitLabel="更新"
          submittingLabel="更新中..."
          resetLabel="元に戻す"
          showResetButton={isDirty}
        >
          <ClientFormFields
            control={control}
            errors={errors}
            isSubmitting={isSubmitting}
          />

          {/* キャンセルボタン */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link href={`/dashboard/clients/${client.id}`}>
              <Button type="button" variant="outline" size="sm">
                キャンセル
              </Button>
            </Link>
          </div>

          {/* フォーム状態表示（開発用） */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-gray-100 rounded">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">
                フォーム状態
              </h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>有効: {isValid ? 'はい' : 'いいえ'}</li>
                <li>変更済み: {isDirty ? 'はい' : 'いいえ'}</li>
                <li>送信中: {isSubmitting ? 'はい' : 'いいえ'}</li>
              </ul>
            </div>
          )}
        </BaseForm>
      </div>
    </div>
  );
}
