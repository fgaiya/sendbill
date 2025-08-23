import React from 'react';

import { Card } from './card';
import { FormActions } from './FormActions';
import { FormStatusMessage } from './FormStatusMessage';
import { Spinner } from './spinner';

interface BaseFormProps {
  title: string;
  description: string;
  children: React.ReactNode;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<unknown>;
  onReset: () => void;
  isLoading?: boolean;
  isSubmitting: boolean;
  isValid?: boolean;
  submitError?: string;
  submitSuccess?: boolean;
  successMessage?: string;
  submitLabel?: string;
  submittingLabel?: string;
  resetLabel?: string;
  showResetButton?: boolean;
  loadingMessage?: string;
}

export function BaseForm({
  title,
  description,
  children,
  onSubmit,
  onReset,
  isLoading = false,
  isSubmitting,
  isValid = true,
  submitError,
  submitLabel = '送信',
  submittingLabel = '送信中...',
  resetLabel = 'リセット',
  showResetButton = true,
  loadingMessage = '読み込み中...',
}: BaseFormProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
          <span className="ml-2 text-gray-600">{loadingMessage}</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-2">{description}</p>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await onSubmit(e);
        }}
        className="space-y-6"
      >
        {children}

        {submitError && (
          <FormStatusMessage type="error" message={submitError} />
        )}

        {/* アクション */}
        <FormActions
          isSubmitting={isSubmitting}
          isValid={isValid}
          onReset={onReset}
          submitLabel={submitLabel}
          submittingLabel={submittingLabel}
          resetLabel={resetLabel}
          showResetButton={showResetButton}
        />
      </form>
    </Card>
  );
}
