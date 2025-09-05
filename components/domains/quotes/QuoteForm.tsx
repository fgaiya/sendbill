'use client';

import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { BaseForm } from '@/components/ui/BaseForm';
import type { CompanyForCalculation } from '@/lib/domains/quotes/calculations';
import { DEFAULT_COMPANY } from '@/lib/domains/quotes/calculations';
import { useQuoteForm } from '@/lib/domains/quotes/hooks';
import { toNumber, toBoolean } from '@/lib/shared/utils';

import { QuoteFormFields } from './QuoteFormFields';
import { QuotePreviewModal } from './QuotePreviewModal';

export function QuoteForm() {
  const { form, state, actions } = useQuoteForm();
  const router = useRouter();
  const [isActionAllowed, setIsActionAllowed] = useState<boolean | undefined>(
    undefined
  );
  const [blockMessage, setBlockMessage] = useState<string | undefined>(
    undefined
  );
  const [company, setCompany] = useState<CompanyForCalculation | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const {
    control,
    setValue,
    watch,
    formState: { errors, isValid, isDirty },
  } = form;

  const { isSubmitting, submitError } = state;
  const { onReset } = actions;

  // フォームデータを監視してリアルタイム更新
  const watchedValues = watch();
  const {
    items = [],
    clientName,
    issueDate,
    expiryDate,
    title,
    description,
    notes,
  } = watchedValues;

  // 会社設定を取得
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const response = await fetch('/api/companies');
        if (response.ok) {
          const companies = await response.json();
          if (Array.isArray(companies) && companies.length > 0) {
            const companyData = companies[0];
            setCompany({
              standardTaxRate: toNumber(
                companyData.standardTaxRate,
                DEFAULT_COMPANY.standardTaxRate
              ),
              reducedTaxRate: toNumber(
                companyData.reducedTaxRate,
                DEFAULT_COMPANY.reducedTaxRate
              ),
              priceIncludesTax: toBoolean(
                companyData.priceIncludesTax,
                DEFAULT_COMPANY.priceIncludesTax
              ),
            });
          } else {
            // 配列が空の場合もデフォルトへフォールバック
            setCompany(DEFAULT_COMPANY);
          }
        } else {
          // 非2xx時もデフォルトへフォールバック
          setCompany(DEFAULT_COMPANY);
        }
      } catch (error) {
        console.error('Failed to fetch company:', error);
        // デフォルト値を設定
        setCompany(DEFAULT_COMPANY);
      } finally {
        setIsLoadingCompany(false);
      }
    };

    fetchCompany();
  }, []);

  // 帳票作成の事前チェック（上限超過時にフォーム無効化）
  useEffect(() => {
    const controller = new AbortController();
    const check = async () => {
      try {
        const res = await fetch(
          '/api/billing/usage/check?action=document_create',
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error('使用量の確認に失敗しました');
        const json = await res.json();
        const allowed = Boolean(json?.allowed);
        setIsActionAllowed(allowed);
        if (!allowed) {
          setBlockMessage(
            '今月の作成上限に達しました。アップグレードをご検討ください。'
          );
        } else {
          setBlockMessage(undefined);
        }
      } catch (_e) {
        // ネットワーク/一時失敗時は無効化せず進める
        setIsActionAllowed(true);
      }
    };
    void check();
    return () => controller.abort();
  }, []);

  // キーボードショートカット（Cmd/Ctrl + P）でプレビューを開く
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        setShowPreviewModal(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <BaseForm
          title="見積書作成"
          description="新しい見積書を作成してください"
          onSubmit={async () => {
            const saved = await actions.submitAndGet();
            if (saved) {
              router.push('/dashboard/documents');
            }
          }}
          onReset={onReset}
          isSubmitting={isSubmitting}
          isValid={isValid && (isActionAllowed ?? true)}
          submitError={submitError}
          submitLabel="作成"
          submittingLabel="作成中..."
        >
          {blockMessage && (
            <div className="p-3 rounded bg-yellow-50 text-yellow-800 text-sm">
              {blockMessage}（ヘッダー右上の「アップグレード」からCheckoutへ）
            </div>
          )}
          <QuoteFormFields
            control={control}
            errors={errors}
            setValue={setValue}
            company={company}
            isSubmitting={isSubmitting}
          />

          {/* 全画面プレビューボタン */}
          <div className="mt-6 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              全画面プレビュー
            </button>
            <div className="text-sm text-gray-500">
              ショートカット: Cmd/Ctrl + P
            </div>
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
                <li>品目数: {items.length}</li>
                <li>
                  会社設定読み込み中: {isLoadingCompany ? 'はい' : 'いいえ'}
                </li>
                <li>会社設定取得済み: {company ? 'はい' : 'いいえ'}</li>
              </ul>
            </div>
          )}
        </BaseForm>

        {/* 全画面プレビューモーダル */}
        {!isLoadingCompany && company && (
          <QuotePreviewModal
            isOpen={showPreviewModal}
            onClose={() => setShowPreviewModal(false)}
            items={items}
            company={company}
            clientName={clientName}
            issueDate={issueDate ? new Date(issueDate) : undefined}
            expiryDate={expiryDate ? new Date(expiryDate) : undefined}
            title={title}
            description={description}
            notes={notes}
          />
        )}
      </div>
    </div>
  );
}
