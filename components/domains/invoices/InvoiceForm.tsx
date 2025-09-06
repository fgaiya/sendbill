'use client';

import React, { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { BaseForm } from '@/components/ui/BaseForm';
import { useInvoiceForm } from '@/lib/domains/invoices/hooks';
import type { CompanyWithBankInfo } from '@/lib/domains/invoices/types';
import { DEFAULT_COMPANY_WITH_BANK } from '@/lib/domains/invoices/types';
import { toNumber, toBoolean } from '@/lib/shared/utils';

import { InvoiceFormFields } from './InvoiceFormFields';

export function InvoiceForm() {
  const { form, state, actions } = useInvoiceForm();
  const router = useRouter();
  const [company, setCompany] = useState<CompanyWithBankInfo | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [isActionAllowed, setIsActionAllowed] = useState<boolean | undefined>(
    undefined
  );
  const [blockMessage, setBlockMessage] = useState<string | undefined>(
    undefined
  );

  const {
    control,
    setValue,
    watch,
    formState: { errors, isValid },
  } = form;

  const { isSubmitting, submitError } = state;
  const { onReset } = actions;

  // フォームデータを監視してリアルタイム更新
  const watchedValues = watch();
  const { issueDate, dueDate } = watchedValues;

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
              id: companyData.id,
              standardTaxRate: toNumber(
                companyData.standardTaxRate,
                DEFAULT_COMPANY_WITH_BANK.standardTaxRate
              ),
              reducedTaxRate: toNumber(
                companyData.reducedTaxRate,
                DEFAULT_COMPANY_WITH_BANK.reducedTaxRate
              ),
              priceIncludesTax: toBoolean(
                companyData.priceIncludesTax,
                DEFAULT_COMPANY_WITH_BANK.priceIncludesTax
              ),
              invoiceNumberSeq: toNumber(
                companyData.invoiceNumberSeq,
                DEFAULT_COMPANY_WITH_BANK.invoiceNumberSeq
              ),
              invoiceRegistrationNumber:
                companyData.invoiceRegistrationNumber || null,
              bankName: companyData.bankName || null,
              bankBranch: companyData.bankBranch || null,
              bankAccountNumber: companyData.bankAccountNumber || null,
              bankAccountHolder: companyData.bankAccountHolder || null,
            });
          } else {
            // 配列が空の場合もデフォルトへフォールバック
            setCompany({
              id: '',
              standardTaxRate: 10,
              reducedTaxRate: 8,
              priceIncludesTax: false,
              invoiceNumberSeq: 1,
              invoiceRegistrationNumber: null,
              bankName: null,
              bankBranch: null,
              bankAccountNumber: null,
              bankAccountHolder: null,
            });
          }
        } else {
          // 非2xx時もデフォルトへフォールバック
          setCompany({
            id: '',
            standardTaxRate: 10,
            reducedTaxRate: 8,
            priceIncludesTax: false,
            invoiceNumberSeq: 1,
            invoiceRegistrationNumber: null,
            bankName: null,
            bankBranch: null,
            bankAccountNumber: null,
            bankAccountHolder: null,
          });
        }
      } catch (error) {
        console.error('Failed to fetch company:', error);
        // デフォルト値を設定
        setCompany({
          id: '',
          standardTaxRate: 10,
          reducedTaxRate: 8,
          priceIncludesTax: false,
          invoiceNumberSeq: 1,
          invoiceRegistrationNumber: null,
          bankName: null,
          bankBranch: null,
          bankAccountNumber: null,
          bankAccountHolder: null,
        });
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

  // 発行日変更時に支払期限を自動計算する機能（オプション）
  useEffect(() => {
    // 発行日が変更され、かつ支払期限が未設定の場合、自動計算を提案
    if (issueDate && !dueDate && !isLoadingCompany) {
      // 30日後の支払期限を自動設定
      const calculatedDueDate = new Date(issueDate);
      calculatedDueDate.setDate(calculatedDueDate.getDate() + 30);
      setValue('dueDate', calculatedDueDate, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [issueDate, dueDate, setValue, isLoadingCompany]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <BaseForm
          title="請求書作成"
          description="新しい請求書を作成してください"
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
          <InvoiceFormFields
            control={control}
            errors={errors}
            setValue={setValue}
            company={company}
            isSubmitting={isSubmitting}
          />

          {/* キーボードショートカット案内 */}
          <div className="mt-6 flex justify-end">
            <div className="text-sm text-gray-500">Cmd/Ctrl + Enterで作成</div>
          </div>
        </BaseForm>
      </div>
    </div>
  );
}
