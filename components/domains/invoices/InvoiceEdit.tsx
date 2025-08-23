'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { BaseForm } from '@/components/ui/BaseForm';
import { useInvoiceForm } from '@/lib/domains/invoices/hooks';
import type {
  CompanyWithBankInfo,
  Invoice,
} from '@/lib/domains/invoices/types';

import { InvoiceFormFields } from './InvoiceFormFields';

interface InvoiceEditProps {
  invoice: Invoice;
}

export function InvoiceEdit({ invoice }: InvoiceEditProps) {
  const { form, state, actions } = useInvoiceForm({ invoiceId: invoice.id });

  const [company, setCompany] = useState<CompanyWithBankInfo | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);

  const {
    control,
    setValue,
    formState: { errors, isValid },
  } = form;

  const { isSubmitting, submitError, isLoading, fetchError } = state;
  const { onSubmit, onReset } = actions;

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
              priceIncludesTax:
                typeof companyData.priceIncludesTax === 'boolean'
                  ? companyData.priceIncludesTax
                  : String(companyData.priceIncludesTax).toLowerCase() ===
                    'true',
              invoiceNumberSeq: companyData.invoiceNumberSeq || 0,
              bankName: companyData.bankName || null,
              bankBranch: companyData.bankBranch || null,
              bankAccountNumber: companyData.bankAccountNumber || null,
              bankAccountHolder: companyData.bankAccountHolder || null,
            });
          } else {
            setCompany({
              id: '',
              standardTaxRate: 10,
              reducedTaxRate: 8,
              priceIncludesTax: false,
              invoiceNumberSeq: 0,
              bankName: null,
              bankBranch: null,
              bankAccountNumber: null,
              bankAccountHolder: null,
            });
          }
        } else {
          setCompany({
            id: '',
            standardTaxRate: 10,
            reducedTaxRate: 8,
            priceIncludesTax: false,
            invoiceNumberSeq: 0,
            bankName: null,
            bankBranch: null,
            bankAccountNumber: null,
            bankAccountHolder: null,
          });
        }
      } catch {
        setCompany({
          id: '',
          standardTaxRate: 10,
          reducedTaxRate: 8,
          priceIncludesTax: false,
          invoiceNumberSeq: 0,
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

  const loading = isLoading || isLoadingCompany;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center text-sm text-gray-500 mb-4">
          <Link
            href="/dashboard/documents?type=invoice"
            className="hover:text-gray-700 transition-colors"
          >
            請求書一覧
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/dashboard/invoices/${invoice.id}`}
            className="hover:text-gray-700 transition-colors"
          >
            {invoice.invoiceNumber || invoice.id}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">編集</span>
        </nav>

        <BaseForm
          title="請求書の編集"
          description="必要な項目を変更して保存してください"
          onSubmit={onSubmit}
          onReset={onReset}
          isLoading={loading}
          isSubmitting={isSubmitting}
          isValid={isValid}
          submitError={fetchError || submitError}
          submitLabel="保存"
          submittingLabel="保存中..."
          resetLabel="元に戻す"
        >
          <InvoiceFormFields
            control={control}
            errors={errors}
            setValue={setValue}
            company={company}
            isSubmitting={isSubmitting}
          />
        </BaseForm>

        <div className="mt-6">
          <Link
            href={`/dashboard/invoices/${invoice.id}`}
            className="text-blue-600 hover:underline text-sm"
          >
            詳細に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
