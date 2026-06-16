import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useModalKeyboardInset } from '../hooks/useModalKeyboardInset';
import { isStandalonePwa } from '../lib/platform';
import { ui } from '../lib/uiClasses';

/** Bottom sheet on mobile, centered dialog on desktop. */
export function AppModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxHeightClass = 'max-h-[min(92dvh,720px)] sm:max-h-[85dvh]',
  ariaLabelledBy = 'app-modal-title',
}) {
  const { keyboard: keyboardInset, viewportHeight } = useModalKeyboardInset(open);
  const standalone = isStandalonePwa();

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
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        ...(keyboardInset ? { paddingBottom: keyboardInset } : {}),
      }}
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
        className={`relative z-10 flex ${keyboardInset ? '' : maxHeightClass} w-full max-w-lg flex-col overflow-hidden rounded-t-[20px] [border:0.5px_solid_rgba(255,255,255,0.12)] shadow-xl sm:rounded-[20px] bg-[var(--bg-secondary)]`}
        style={keyboardInset && viewportHeight ? { maxHeight: viewportHeight - 52 } : undefined}
      >
        <div
          className="mx-auto mt-2 mb-1 h-1 w-10 shrink-0 rounded-full bg-[rgba(255,255,255,0.15)] sm:hidden"
          aria-hidden
        />

        <header
          className="shrink-0 flex items-center justify-between gap-3 [border-bottom:0.5px_solid_rgba(255,255,255,0.08)] px-5 py-4 sm:px-6"
        >
          <div className="min-w-0">
            <h2
              id={ariaLabelledBy}
              className={`text-lg font-semibold ${ui.heading}`}
            >
              {title}
            </h2>
            {subtitle ? (
              <p className={`mt-1 text-sm ${ui.textMuted}`}>{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
          {children}
        </div>

        {footer ? (
          <footer
            className={`shrink-0 flex flex-col-reverse gap-2 [border-top:0.5px_solid_rgba(255,255,255,0.08)] px-5 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:px-6 sm:pb-4 bg-[var(--bg-secondary)] ${
              standalone
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
