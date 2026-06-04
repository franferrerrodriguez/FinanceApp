import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useFinanceAlerts } from '../hooks/useFinanceAlerts';
import { ui } from '../lib/uiClasses';
import { FinanceAlerts } from './FinanceAlerts';

export function AppAlertsButton({ className = '' }) {
  const { t } = useTranslation();
  const { alerts } = useFinanceAlerts();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const panelRef = useRef(null);

  const count = alerts.length;
  const hasDanger = alerts.some((a) => a.severity === 'danger');

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <div className={className}>
        <button
          type="button"
          className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition ${
            open
              ? 'border-emerald-500/60 bg-emerald-500/10 ring-2 ring-emerald-500/25'
              : `${ui.profileChip} hover:border-slate-300 dark:hover:border-slate-600`
          }`}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-controls={open ? panelId : undefined}
          aria-label={
            count > 0
              ? t('alerts.openButtonWithCount', { count })
              : t('alerts.openButton')
          }
          onClick={() => setOpen((value) => !value)}
        >
          <BellIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          {count > 0 ? (
            <span
              className={`absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[0.65rem] font-bold text-white ${
                hasDanger ? 'bg-red-600' : 'bg-amber-500'
              }`}
              aria-hidden
            >
              {count > 9 ? '9+' : count}
            </span>
          ) : null}
        </button>
      </div>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[200]">
            <button
              type="button"
              className={ui.menuBackdrop}
              aria-label={t('menu.close')}
              onClick={close}
            />

            <div
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-modal="true"
              aria-label={t('alerts.panelTitle')}
              className={`${ui.menuPanel} right-4 top-4 max-h-[min(32rem,calc(100vh-2rem))] w-[min(24rem,calc(100vw-2rem))]`}
            >
              <div className={`border-b px-4 py-3 ${ui.divider}`}>
                <div className="flex items-start justify-between gap-3 pr-6">
                  <div>
                    <h2 className={`text-base font-semibold ${ui.heading}`}>
                      {t('alerts.panelTitle')}
                    </h2>
                    <p className={`mt-0.5 text-xs ${ui.textMuted}`}>
                      {count > 0
                        ? t('alerts.panelSubtitle', { count })
                        : t('alerts.panelSubtitleEmpty')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    className={`absolute right-3 top-3 rounded-lg p-1.5 ${ui.textMuted} hover:bg-slate-100 dark:hover:bg-slate-800`}
                    aria-label={t('menu.close')}
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto px-4 py-3">
                {count > 0 ? (
                  <FinanceAlerts alerts={alerts} onAction={close} />
                ) : (
                  <p
                    className={`rounded-xl border px-4 py-6 text-center text-sm ${ui.cardMuted} ${ui.text}`}
                  >
                    {t('alerts.empty')}
                  </p>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function BellIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
