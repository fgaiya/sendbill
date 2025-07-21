import React from 'react';

import { cn } from '@/lib/shared/utils/ui';

export interface FormFieldWrapperProps {
  label: string;
  id?: string;
  required?: boolean;
  error?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormFieldWrapper({
  label,
  id,
  required = false,
  error,
  description,
  className,
  children,
}: FormFieldWrapperProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {description && <p className="text-sm text-gray-500">{description}</p>}
      {children}
      {error && (
        <p className="text-sm text-red-600 animate-in fade-in-0 slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
}
