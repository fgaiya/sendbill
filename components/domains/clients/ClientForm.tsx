'use client';

import React from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useClientForm } from '@/lib/domains/clients/hooks';

import { ClientFormFields } from './ClientFormFields';

export function ClientForm() {
  const { form, state, actions } = useClientForm();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
  } = form;

  const { isSubmitting, submitError, submitSuccess } = state;
  const { onSubmit, onReset } = actions;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">取引先登録</h1>
            <p className="text-gray-600 mt-2">
              新しい取引先の情報を登録してください
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <ClientFormFields
              control={control}
              errors={errors}
              isSubmitting={isSubmitting}
            />

            {/* 送信結果メッセージ */}
            {submitSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md animate-in fade-in-0 slide-in-from-top-2">
                <p className="text-green-800 text-sm font-medium">
                  ✓
                  取引先が正常に登録されました！3秒後にダッシュボードに戻ります...
                </p>
              </div>
            )}

            {submitError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md animate-in fade-in-0 slide-in-from-top-2">
                <p className="text-red-800 text-sm font-medium">
                  ✗ {submitError}
                </p>
              </div>
            )}

            {/* アクション */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onReset}
                disabled={isSubmitting}
              >
                リセット
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !isValid}
                className={isSubmitting ? 'cursor-wait' : ''}
              >
                {isSubmitting && (
                  <Spinner size="sm" color="white" className="mr-2" />
                )}
                {isSubmitting ? '登録中...' : '登録'}
              </Button>
            </div>
          </form>

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
        </Card>
      </div>
    </div>
  );
}
