'use client';

import { BaseForm } from '@/components/ui/BaseForm';
import { useQuoteForm } from '@/lib/domains/quotes/hooks';

import { QuoteFormFields } from './QuoteFormFields';

export function QuoteForm() {
  const { form, state, actions } = useQuoteForm();

  const {
    control,
    setValue,
    formState: { errors, isValid, isDirty },
  } = form;

  const { isSubmitting, submitError } = state;
  const { onSubmit, onReset } = actions;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <BaseForm
          title="見積書作成"
          description="新しい見積書を作成してください"
          onSubmit={onSubmit}
          onReset={onReset}
          isSubmitting={isSubmitting}
          isValid={isValid}
          submitError={submitError}
          submitLabel="作成"
          submittingLabel="作成中..."
        >
          <QuoteFormFields
            control={control}
            errors={errors}
            setValue={setValue}
            isSubmitting={isSubmitting}
          />

          {/* フォーム状態表示（開発用） */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-gray-100 rounded">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">
                フォーム状態
              </h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>有効: {isValid ? 'はい' : 'いいえ'}</li>
                <li>変更済み: {isDirty ? 'はい' : 'いいえ'}</li>
                <li>送信中: {isSubmitting ? 'はい' : 'いいえ'}</li>
              </ul>
            </div>
          )}
        </BaseForm>
      </div>
    </div>
  );
}
