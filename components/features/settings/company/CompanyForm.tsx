'use client';

import React from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useCompanyForm } from '@/lib/features/settings/company';

import { CompanyFormFields } from './CompanyFormFields';

export function CompanyForm() {
  const {
    control,
    handleSubmit,
    errors,
    isSubmitting,
    isValid,
    isLoading,
    submitError,
    submitSuccess,
    existingCompany,
    onSubmit,
    handleReset,
  } = useCompanyForm();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
          <span className="ml-2 text-gray-600">読み込み中...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">会社基本情報</h1>
        <p className="text-gray-600 mt-2">
          請求書や見積書に表示される会社情報を設定してください
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <CompanyFormFields
          control={control}
          errors={errors}
          isSubmitting={isSubmitting}
        />

        {/* 送信結果メッセージ */}
        {submitSuccess && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md animate-in fade-in-0 slide-in-from-top-2">
            <p className="text-green-800 text-sm font-medium">
              ✓ 会社情報が正常に保存されました！
            </p>
          </div>
        )}

        {submitError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md animate-in fade-in-0 slide-in-from-top-2">
            <p className="text-red-800 text-sm font-medium">✗ {submitError}</p>
          </div>
        )}

        {/* アクション */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
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
            {isSubmitting ? '保存中...' : existingCompany ? '更新' : '保存'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
