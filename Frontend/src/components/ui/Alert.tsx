import { AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Alert({
  message,
  onDismiss,
  variant = 'error',
}: {
  message: string;
  onDismiss?: () => void;
  variant?: 'error' | 'info';
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-lg px-4 py-3 text-sm',
        variant === 'error' ? 'bg-red-50 text-red-800' : 'bg-fairway-50 text-fairway-800',
      )}
    >
      <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
      <p className="flex-1">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-0.5 hover:bg-black/5"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
