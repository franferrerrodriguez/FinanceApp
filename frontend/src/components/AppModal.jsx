import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useModalKeyboardInset } from '../hooks/useModalKeyboardInset';
import { isNativeApp } from '../lib/platform';
import { ui } from '../lib/uiClasses';

/** Bottom sheet on mobile, centered dialog on desktop. Tuned for Capacitor WebView. */
export function AppModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  ariaLabelledBy = 'app-modal-title',
}) {
  const keyboardInset = useModalKeyboardInset(open);
  const native = isNativeApp();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[210] flex items-end justify-center sm:items-center sm:p-4"
      style={keyboardInset ? { paddingBottom: keyboardInset } : undefined}
    >
      <button
        type="button"
        className={`absolute inset-0 ${ui.menuBackdrop}`}
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        className={`relative z-10 flex max-h-[min(92dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border shadow-xl sm:max-h-[85dvh] sm:rounded-2xl ${ui.divider} bg-white dark:bg-slate-900`}
      >
        <div
          className="mx-auto mt-2 mb-1 h-1 w-10 shrink-0 rounded-full bg-slate-300 dark:bg-slate-600 sm:hidden"
          aria-hidden
        />

        <header
          className={`shrink-0 border-b px-5 py-4 sm:px-6 ${ui.divider}`}
        >
          <h2
            id={ariaLabelledBy}
            className={`text-lg font-semibold ${ui.heading}`}
          >
            {title}
          </h2>
          {subtitle ? (
            <p className={`mt-1 text-sm ${ui.textMuted}`}>{subtitle}</p>
          ) : null}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
          {children}
        </div>

        {footer ? (
          <footer
            className={`shrink-0 flex flex-col-reverse gap-2 border-t px-5 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:px-6 sm:pb-4 ${ui.divider} ${
              native
                ? 'pb-[max(1rem,env(safe-area-inset-bottom))]'
                : 'pb-4'
            }`}
          >
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
