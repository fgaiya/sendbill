import { Button } from './button';
import { Spinner } from './spinner';

interface FormActionsProps {
  isSubmitting: boolean;
  isValid?: boolean;
  onReset: () => void;
  submitLabel?: string;
  submittingLabel?: string;
  resetLabel?: string;
  showResetButton?: boolean;
}

export function FormActions({
  isSubmitting,
  isValid = true,
  onReset,
  submitLabel = '送信',
  submittingLabel = '送信中...',
  resetLabel = 'リセット',
  showResetButton = true,
}: FormActionsProps) {
  return (
    <div className="flex justify-end gap-3 pt-4">
      {showResetButton && (
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          disabled={isSubmitting}
        >
          {resetLabel}
        </Button>
      )}
      <Button
        type="submit"
        disabled={isSubmitting || !isValid}
        className={isSubmitting ? 'cursor-wait' : ''}
      >
        {isSubmitting && <Spinner size="sm" color="white" className="mr-2" />}
        {isSubmitting ? submittingLabel : submitLabel}
      </Button>
    </div>
  );
}
