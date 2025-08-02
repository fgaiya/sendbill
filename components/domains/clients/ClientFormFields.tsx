'use client';

import React from 'react';

import { ClientFormData } from '@/lib/domains/clients/types';

import { ClientBasicInfoFields } from './ClientBasicInfoFields';
import { ClientContactInfoFields } from './ClientContactInfoFields';

import type { Control, FieldErrors } from 'react-hook-form';

interface ClientFormFieldsProps {
  control: Control<ClientFormData>;
  errors: FieldErrors<ClientFormData>;
  isSubmitting: boolean;
}

export function ClientFormFields({
  control,
  errors,
  isSubmitting,
}: ClientFormFieldsProps) {
  return (
    <div className="space-y-6">
      <ClientBasicInfoFields
        control={control}
        errors={errors}
        isSubmitting={isSubmitting}
      />

      <ClientContactInfoFields
        control={control}
        errors={errors}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
