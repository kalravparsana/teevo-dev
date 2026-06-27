import { useId, useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { readImageFileAsDataUrl } from '@/lib/images/readImageFile';

interface ImageUploadProps {
  label: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  error?: string;
  required?: boolean;
  hint?: string;
}

export function ImageUpload({
  label,
  value,
  onChange,
  error,
  required,
  hint = 'PNG, JPG, WebP, or SVG · max 512 KB',
}: ImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = error ?? localError ?? undefined;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setLocalError(null);
    setLoading(true);
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      onChange(dataUrl);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Could not upload image.');
      onChange(null);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink" id={`${inputId}-label`}>
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>

      <div
        className={cn(
          'rounded-lg border border-dashed border-sand-300 bg-white p-4',
          displayError && 'border-red-500',
        )}
      >
        {value ? (
          <div className="flex items-center gap-4">
            <img
              src={value}
              alt="Selected club logo preview"
              className="h-16 w-16 rounded-lg border border-sand-300/70 object-cover"
            />
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={loading}
                className="text-sm font-medium text-fairway-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fairway-500/30"
              >
                Replace image
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocalError(null);
                  onChange(null);
                }}
                disabled={loading}
                className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fairway-500/30"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className={cn(
              'flex w-full flex-col items-center gap-2 rounded-md py-4 text-center',
              'text-sm text-muted transition-colors',
              'hover:bg-fairway-50 hover:text-fairway-900',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fairway-500/30',
              loading && 'cursor-wait opacity-70',
            )}
            aria-labelledby={`${inputId}-label`}
          >
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-fairway-700" aria-hidden />
            ) : (
              <ImagePlus className="h-8 w-8 text-fairway-600" aria-hidden />
            )}
            <span>{loading ? 'Uploading…' : 'Choose club logo'}</span>
            <span className="text-xs">{hint}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="sr-only"
        aria-describedby={displayError ? `${inputId}-error` : undefined}
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />

      {displayError && (
        <p id={`${inputId}-error`} className="text-xs text-red-600" role="alert">
          {displayError}
        </p>
      )}
    </div>
  );
}
