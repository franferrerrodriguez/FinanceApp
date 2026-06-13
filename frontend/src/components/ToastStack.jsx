import { X } from 'lucide-react';

const VARIANT_BORDER = {
  success: 'border-l-[var(--color-positive)]',
  error: 'border-l-[var(--color-negative)]',
  info: 'border-l-[var(--color-info)]',
  warn: 'border-l-[var(--color-warning)]',
};

export function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[300] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:items-end"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => {
        const borderClass = VARIANT_BORDER[toast.variant] ?? VARIANT_BORDER.info;
        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl [border:0.5px_solid_rgba(255,255,255,0.14)] border-l-4 ${borderClass} bg-[#1A2030] px-4 py-3 text-sm leading-snug shadow-lg text-[var(--text-secondary)]`}
          >
            <p className="min-w-0 flex-1">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 rounded-md p-0.5 text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
