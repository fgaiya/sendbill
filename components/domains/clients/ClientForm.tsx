'use client';

import React from 'react';

import { BaseForm } from '@/components/ui/BaseForm';
import { useClientForm } from '@/lib/domains/clients/hooks';

import { ClientFormFields } from './ClientFormFields';

export function ClientForm() {
  const { form, state, actions } = useClientForm();

  const {
    control,
    formState: { errors, isValid, isDirty },
  } = form;

  const { isSubmitting, submitError, submitSuccess } = state;
  const { onSubmit, onReset } = actions;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto">
        <BaseForm
          title="取引先登録"
          description="新しい取引先の情報を登録してください"
          onSubmit={onSubmit}
          onReset={onReset}
          isSubmitting={isSubmitting}
          isValid={isValid}
          submitError={submitError}
          submitSuccess={submitSuccess}
          successMessage="取引先が正常に登録されました！3秒後にダッシュボードに戻ります..."
          submitLabel="登録"
          submittingLabel="登録中..."
        >
          <ClientFormFields
            control={control}
            errors={errors}
            isSubmitting={isSubmitting}
          />

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
