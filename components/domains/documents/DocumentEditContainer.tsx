'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

import { useRouter } from 'next/navigation';

import { AlertTriangle, Save, X } from 'lucide-react';

import { InvoiceFormFields } from '@/components/domains/invoices/InvoiceFormFields';
import { QuoteFormFields } from '@/components/domains/quotes/QuoteFormFields';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Document as DocumentType, isQuote } from '@/lib/domains/documents';
import { useInvoiceForm } from '@/lib/domains/invoices/hooks';
import { useQuoteForm } from '@/lib/domains/quotes/hooks';
import { cn } from '@/lib/shared/utils';
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
} from '@/lib/shared/utils/storage';

interface DocumentEditContainerProps {
  document: DocumentType;
  onSave: (document: DocumentType) => Promise<void>;
  onCancel: () => void;
  className?: string;
}

export function DocumentEditContainer({
  document,
  onSave,
  onCancel,
  className,
}: DocumentEditContainerProps) {
  const router = useRouter();
  const [saveError, setSaveError] = useState<string>();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [restoredFromBackup, setRestoredFromBackup] = useState(false);
  const [hasBackup, setHasBackup] = useState(false);
  const lockSetRef = useRef(false);

  const isQuoteDocument = isQuote(document);

  // 編集用フックの初期化
  const quoteForm = useQuoteForm({
    quoteId: document.id,
    enabled: isQuoteDocument,
  });
  const invoiceForm = useInvoiceForm({
    invoiceId: document.id,
    enabled: !isQuoteDocument,
  });

  // 適切なフォームを選択
  const currentForm = isQuoteDocument ? quoteForm : invoiceForm;
  const { state, actions } = currentForm;
  const effectiveForm = isQuoteDocument ? quoteForm.form : invoiceForm.form;
  const backupKey = `doc:backup:${document.documentType}:${document.id}`;
  const lockKey = `doc:lock:${document.documentType}:${document.id}`;
  const tabIdRef = useRef<string>(
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );

  // カスタム保存処理
  const handleSave = useCallback(async () => {
    try {
      setSaveError(undefined);

      // submitAndGetを使用してサーバーレスポンスを取得
      const updatedData = await actions.submitAndGet();

      if (updatedData) {
        // サーバーから返された実際の更新データを使用して型安全に変換
        const updatedDocument: DocumentType = isQuoteDocument
          ? ({
              ...document,
              ...updatedData,
              documentType: 'quote' as const,
            } as DocumentType)
          : ({
              ...document,
              ...updatedData,
              documentType: 'invoice' as const,
            } as DocumentType);

        await onSave(updatedDocument);
        setHasUnsavedChanges(false);
        removeStorageItem(backupKey);
        setHasBackup(false);

        // 保存後にリダイレクト
        router.push('/dashboard/documents');
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `${isQuoteDocument ? '見積書' : '請求書'}の更新に失敗しました`;
      setSaveError(message);
    }
  }, [actions, onSave, document, isQuoteDocument, backupKey, router]);

  // フォーム変更検知
  useEffect(() => {
    setHasUnsavedChanges(effectiveForm.formState.isDirty);
  }, [effectiveForm.formState.isDirty]);

  // 編集モード開始：ソフトロックとバックアップ復元を試行
  useEffect(() => {
    if (!lockSetRef.current) {
      try {
        setStorageItem(
          lockKey,
          JSON.stringify({ tabId: tabIdRef.current, ts: Date.now() })
        );
        lockSetRef.current = true;
      } catch {}
    }
    try {
      const raw = getStorageItem(backupKey);
      setHasBackup(!!raw);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const currentValues = effectiveForm.getValues();
          const merged = {
            ...currentValues,
            ...parsed,
          } as typeof currentValues;
          effectiveForm.reset(merged);
          setRestoredFromBackup(true);
          setHasUnsavedChanges(true);
        }
      }
    } catch {}
    return () => {
      removeStorageItem(lockKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // フォーム変更時にバックアップを保存
  useEffect(() => {
    const sub = effectiveForm.watch((values) => {
      try {
        setStorageItem(backupKey, JSON.stringify(values));
        setHasBackup(true);
      } catch {}
    });
    return () => {
      if (sub && typeof sub === 'object' && 'unsubscribe' in sub)
        sub.unsubscribe();
    };
  }, [effectiveForm, backupKey]);

  // キャンセル処理
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      if (
        !window.confirm('変更内容が保存されていません。編集を終了しますか？')
      ) {
        return;
      }
    }
    onCancel();
  }, [hasUnsavedChanges, onCancel]);

  // バックアップからの復元
  const handleRestore = useCallback(() => {
    try {
      const raw = getStorageItem(backupKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        const currentValues = effectiveForm.getValues();
        const merged = {
          ...currentValues,
          ...parsed,
        } as typeof currentValues;
        effectiveForm.reset(merged);
        setRestoredFromBackup(true);
      }
    } catch {}
  }, [backupKey, effectiveForm]);

  // ローディング状態
  if (state.isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            {isQuoteDocument ? '見積書' : '請求書'}を読み込み中...
          </p>
        </div>
      </div>
    );
  }

  // 読み込みエラー
  if (state.fetchError) {
    return (
      <div className={cn('space-y-6', className)}>
        <Card className="border-red-200 bg-red-50">
          <div className="p-4 flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="font-medium text-red-800">読み込みエラー</h3>
              <p className="text-sm text-red-700">{state.fetchError}</p>
            </div>
          </div>
        </Card>
        <div className="flex justify-end">
          <Button onClick={onCancel} variant="outline">
            閉じる
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* エラー表示 */}
      {saveError && (
        <Card className="border-red-200 bg-red-50">
          <div className="p-3 flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-800">{saveError}</p>
          </div>
        </Card>
      )}

      {/* 未保存変更の警告 */}
      {hasUnsavedChanges && (
        <Card className="border-yellow-200 bg-yellow-50">
          <div className="p-3 flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              変更内容が保存されていません。「保存」ボタンをクリックして変更を保存してください。
            </p>
          </div>
        </Card>
      )}
      {restoredFromBackup && (
        <Card className="border-blue-200 bg-blue-50">
          <div className="p-3 text-sm text-blue-800">
            自動バックアップから内容を復元しました。
          </div>
        </Card>
      )}

      {/* 編集フォーム */}
      <div className="bg-white border rounded-lg">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {isQuoteDocument ? '見積書' : '請求書'}の編集
            </h2>
            <p className="text-sm text-gray-600">
              必要な項目を変更して保存してください
            </p>
          </div>

          {isQuoteDocument ? (
            <QuoteFormFields
              control={quoteForm.form.control}
              errors={quoteForm.form.formState.errors}
              setValue={quoteForm.form.setValue}
              company={null}
              isSubmitting={state.isSubmitting}
            />
          ) : (
            <InvoiceFormFields
              control={invoiceForm.form.control}
              errors={invoiceForm.form.formState.errors}
              setValue={invoiceForm.form.setValue}
              company={null}
              isSubmitting={state.isSubmitting}
            />
          )}
        </div>
      </div>

      {/* フッターアクション */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          {hasUnsavedChanges && (
            <span className="text-orange-600">※ 未保存の変更があります</span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {hasBackup && (
            <Button
              type="button"
              variant="outline"
              onClick={handleRestore}
              disabled={state.isSubmitting}
            >
              バックアップから復元
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={state.isSubmitting}
          >
            <X className="w-4 h-4 mr-2" />
            キャンセル
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={state.isSubmitting || !hasUnsavedChanges}
          >
            {state.isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                保存
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
