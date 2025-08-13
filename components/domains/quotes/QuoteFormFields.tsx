'use client';

import { type Control, type FieldErrors } from 'react-hook-form';

import type { QuoteFormData } from '@/lib/domains/quotes/schemas';

import { QuoteBasicInfoFields } from './QuoteBasicInfoFields';

import type { QuoteBasicsShape } from './types';

export interface QuoteFormFieldsProps<
  T extends QuoteBasicsShape = QuoteFormData,
> {
  control: Control<T>;
  errors: FieldErrors<T>;
  isSubmitting: boolean;
}

export function QuoteFormFields<T extends QuoteBasicsShape = QuoteFormData>({
  control,
  errors,
  isSubmitting,
}: QuoteFormFieldsProps<T>) {
  return (
    <div className="space-y-6">
      <QuoteBasicInfoFields<T>
        control={control}
        errors={errors}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
