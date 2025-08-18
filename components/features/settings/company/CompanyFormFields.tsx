import React from 'react';

import { CompanyFormData } from '@/lib/features/settings/company';

import { CompanyBankInfoFields } from './CompanyBankInfoFields';
import { CompanyBasicInfoFields } from './CompanyBasicInfoFields';
import { CompanyContactInfoFields } from './CompanyContactInfoFields';
import { CompanyTaxSettingsFields } from './CompanyTaxSettingsFields';

import type { Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
interface CompanyFormFieldsProps {
  control: Control<CompanyFormData>;
  errors: FieldErrors<CompanyFormData>;
  isSubmitting: boolean;
  setValue: UseFormSetValue<CompanyFormData>;
}

export function CompanyFormFields({
  control,
  errors,
  isSubmitting,
  setValue,
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
        setValue={setValue}
      />
      <CompanyBankInfoFields
        control={control}
        errors={errors}
        isSubmitting={isSubmitting}
      />
      <CompanyTaxSettingsFields
        control={control}
        errors={errors}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
