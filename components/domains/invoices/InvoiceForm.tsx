'use client';

import React, { useState, useEffect } from 'react';

import { BaseForm } from '@/components/ui/BaseForm';
import { useInvoiceForm } from '@/lib/domains/invoices/hooks';
import type { CompanyWithBankInfo } from '@/lib/domains/invoices/types';

import { InvoiceFormFields } from './InvoiceFormFields';

export function InvoiceForm() {
  const { form, state, actions } = useInvoiceForm();
  const [company, setCompany] = useState<CompanyWithBankInfo | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);

  const {
    control,
    setValue,
    watch,
    formState: { errors, isValid },
  } = form;

  const { isSubmitting, submitError } = state;
  const { onSubmit, onReset } = actions;

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
              standardTaxRate: Number(companyData.standardTaxRate) || 10,
              reducedTaxRate: Number(companyData.reducedTaxRate) || 8,
              priceIncludesTax: Boolean(companyData.priceIncludesTax),
              invoiceNumberSeq: Number(companyData.invoiceNumberSeq) || 1,
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
          onSubmit={onSubmit}
          onReset={onReset}
          isSubmitting={isSubmitting}
          isValid={isValid}
          submitError={submitError}
          submitLabel="作成"
          submittingLabel="作成中..."
        >
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
