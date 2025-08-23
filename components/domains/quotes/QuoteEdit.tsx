'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { BaseForm } from '@/components/ui/BaseForm';
import type { CompanyForCalculation } from '@/lib/domains/quotes/calculations';
import { DEFAULT_COMPANY } from '@/lib/domains/quotes/calculations';
import { useQuoteForm } from '@/lib/domains/quotes/hooks';
import type { Quote } from '@/lib/domains/quotes/types';
import { toNumber, toBoolean } from '@/lib/shared/utils';

import { QuoteFormFields } from './QuoteFormFields';

interface QuoteEditProps {
  quote: Quote;
}

export function QuoteEdit({ quote }: QuoteEditProps) {
  const { form, state, actions } = useQuoteForm({ quoteId: quote.id });

  const [company, setCompany] = useState<CompanyForCalculation | null>(null);
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
            setCompany(DEFAULT_COMPANY);
          }
        } else {
          setCompany(DEFAULT_COMPANY);
        }
      } catch {
        setCompany(DEFAULT_COMPANY);
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
            href="/dashboard/documents?type=quote"
            className="hover:text-gray-700 transition-colors"
          >
            見積書一覧
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/dashboard/quotes/${quote.id}`}
            className="hover:text-gray-700 transition-colors"
          >
            {quote.quoteNumber || quote.id}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">編集</span>
        </nav>

        <BaseForm
          title="見積書の編集"
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
          <QuoteFormFields
            control={control}
            errors={errors}
            setValue={setValue}
            company={company}
            isSubmitting={isSubmitting}
          />
        </BaseForm>

        <div className="mt-6">
          <Link
            href={`/dashboard/quotes/${quote.id}`}
            className="text-blue-600 hover:underline text-sm"
          >
            詳細に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
