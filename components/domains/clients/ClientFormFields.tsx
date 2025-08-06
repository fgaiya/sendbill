'use client';

import React from 'react';

import { ClientFormData } from '@/lib/domains/clients/schemas';

import { ClientBasicInfoFields } from './ClientBasicInfoFields';
import { ClientContactInfoFields } from './ClientContactInfoFields';

import type { Control, FieldErrors } from 'react-hook-form';

type ClientFieldsShape = ClientFormData | Partial<ClientFormData>;

interface ClientFormFieldsProps<T extends ClientFieldsShape = ClientFormData> {
  control: Control<T>;
  errors: FieldErrors<T>;
  isSubmitting: boolean;
}

export function ClientFormFields<T extends ClientFieldsShape = ClientFormData>({
  control,
  errors,
  isSubmitting,
}: ClientFormFieldsProps<T>) {
  return (
    <div className="space-y-6">
      <ClientBasicInfoFields
        control={control as Control<ClientFormData>}
        errors={errors as FieldErrors<ClientFormData>}
        isSubmitting={isSubmitting}
      />
      <ClientContactInfoFields
        control={control as Control<ClientFormData>}
        errors={errors as FieldErrors<ClientFormData>}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
