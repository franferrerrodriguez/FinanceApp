import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getLastNMonthKeys } from '../lib/dashboardMetrics';
import { usePreferences } from '../store/hooks';
import { ui } from '../lib/uiClasses';
import { formatMonthKeyLong } from '../utils/monthLabel';

const iconBtn =
  'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 disabled:pointer-events-none disabled:opacity-35 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-700/80';

/**
 * Month picker with prev/next (no native &lt;select&gt;).
 * @param {Array<{ monthKey: string, pending?: boolean, hasClose?: boolean }>|null} options
 */
export function MonthKeyPicker({
  value,
  onChange,
  options = null,
  lookbackMonths = 72,
  showStatus = false,
  compact = false,
  className = '',
  ariaLabel,
}) {
  const { locale } = usePreferences();
  const { t } = useTranslation();

  const entries = useMemo(() => {
    if (options?.length) {
      return options.map((o) => ({
        monthKey: o.monthKey,
        pending: o.pending,
        hasClose: o.hasClose,
      }));
    }
    return [...getLastNMonthKeys(lookbackMonths)]
      .reverse()
      .map((monthKey) => ({ monthKey }));
  }, [options, lookbackMonths]);

  const keys = entries.map((e) => e.monthKey);
  const index = Math.max(0, keys.indexOf(value));
  const current = entries[index] ?? entries[0];
  const displayKey = current?.monthKey ?? value;

  const go = (delta) => {
    const next = keys[index + delta];
    if (next) onChange(next);
  };

  if (!keys.length) return null;

  const statusBadge =
    showStatus && current
      ? current.pending
        ? {
            text: t('balance.patrimony.closeMonthPending'),
            className:
              'bg-amber-500/15 text-amber-800 ring-amber-500/30 dark:bg-amber-500/20 dark:text-amber-200 dark:ring-amber-500/40',
          }
        : current.hasClose
          ? {
              text: t('balance.patrimony.closeMonthClosed'),
              className:
                'bg-emerald-500/15 text-emerald-800 ring-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-500/40',
            }
          : null
      : null;

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      role="group"
      aria-label={ariaLabel ?? t('balance.patrimony.closeMonthSelect')}
    >
      <button
        type="button"
        className={iconBtn}
        disabled={index <= 0}
        aria-label={t('balance.patrimony.monthPrev')}
        onClick={() => go(-1)}
      >
        <ChevronIcon direction="left" />
      </button>

      <div
        className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl border px-3 py-2.5 text-center ${ui.cardInset}`}
      >
        <span
          className={`font-semibold tabular-nums ${ui.heading} ${
            compact ? 'text-sm' : 'text-base sm:text-lg'
          }`}
        >
          {formatMonthKeyLong(displayKey, locale)}
        </span>
        {statusBadge ? (
          <span
            className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ring-1 ring-inset ${statusBadge.className}`}
          >
            {statusBadge.text}
          </span>
        ) : null}
        {keys.length > 1 ? (
          <span className={`mt-1 text-[0.65rem] tabular-nums ${ui.textMuted}`}>
            {t('balance.patrimony.monthPosition', {
              current: index + 1,
              total: keys.length,
            })}
          </span>
        ) : null}
      </div>

      <button
        type="button"
        className={iconBtn}
        disabled={index >= keys.length - 1}
        aria-label={t('balance.patrimony.monthNext')}
        onClick={() => go(1)}
      >
        <ChevronIcon direction="right" />
      </button>
    </div>
  );
}

function ChevronIcon({ direction }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      {direction === 'left' ? (
        <path d="M15 18l-6-6 6-6" />
      ) : (
        <path d="M9 18l6-6-6-6" />
      )}
    </svg>
  );
}
