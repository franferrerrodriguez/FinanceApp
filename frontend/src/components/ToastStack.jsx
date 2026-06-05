import { ui } from '../lib/uiClasses';

const VARIANT_STYLES = {
  success:
    'border-emerald-500/35 bg-emerald-50 text-emerald-950 dark:border-emerald-500/40 dark:bg-emerald-950/90 dark:text-emerald-50',
  error:
    'border-red-500/35 bg-red-50 text-red-950 dark:border-red-500/40 dark:bg-red-950/90 dark:text-red-50',
  info:
    'border-slate-300/80 bg-white text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100',
};

export function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[300] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:items-end"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-snug shadow-lg ${VARIANT_STYLES[toast.variant] ?? VARIANT_STYLES.info}`}
        >
          <p className="min-w-0 flex-1">{toast.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className={`shrink-0 rounded-md px-1 text-xs font-semibold opacity-70 transition hover:opacity-100 ${ui.textMuted}`}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
