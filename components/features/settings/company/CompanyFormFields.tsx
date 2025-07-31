import React from 'react';

import { CompanyFormData } from '@/lib/features/settings/company';

import { CompanyBankInfoFields } from './CompanyBankInfoFields';
import { CompanyBasicInfoFields } from './CompanyBasicInfoFields';
import { CompanyContactInfoFields } from './CompanyContactInfoFields';

import type { Control, FieldErrors } from 'react-hook-form';
interface CompanyFormFieldsProps {
  control: Control<CompanyFormData>;
  errors: FieldErrors<CompanyFormData>;
  isSubmitting: boolean;
}

export function CompanyFormFields({
  control,
  errors,
  isSubmitting,
}: CompanyFormFieldsProps) {
  return (
    <>
      <CompanyBasicInfoFields
        control={control}
        errors={errors}
        isSubmitting={isSubmitting}
      />
      <CompanyContactInfoFields
        control={control}
        errors={errors}
        isSubmitting={isSubmitting}
      />
      <CompanyBankInfoFields
        control={control}
        errors={errors}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
