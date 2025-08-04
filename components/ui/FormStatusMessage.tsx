interface FormStatusMessageProps {
  type: 'success' | 'error';
  message: string;
}

export function FormStatusMessage({ type, message }: FormStatusMessageProps) {
  const isSuccess = type === 'success';

  return (
    <div
      className={`p-4 border rounded-md animate-in fade-in-0 slide-in-from-top-2 ${
        isSuccess ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }`}
    >
      <p
        className={`text-sm font-medium ${
          isSuccess ? 'text-green-800' : 'text-red-800'
        }`}
      >
        {isSuccess ? '✓' : '✗'} {message}
      </p>
    </div>
  );
}
