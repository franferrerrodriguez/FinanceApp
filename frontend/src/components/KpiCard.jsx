import { DEFAULT_SETTINGS } from '../lib/constants';
import { ui } from '../lib/uiClasses';

export function getSavingsTone(rate) {
  if (rate >= DEFAULT_SETTINGS.SAVINGS_RATE_GREEN) return 'savings';
  if (rate >= DEFAULT_SETTINGS.SAVINGS_RATE_YELLOW) return 'warn';
  return 'danger';
}

export function getNetWorthTone(netWorth) {
  if (netWorth == null || !Number.isFinite(netWorth)) return 'default';
  if (netWorth < 0) return 'danger';
  return 'netWorth';
}

/** Shared KPI value colors (Dashboard + Patrimonio). */
export const KPI_VALUE_TONE_CLASS = {
  default: ui.heading,
  netWorth: 'text-emerald-600 dark:text-emerald-400',
  assets: 'text-sky-600 dark:text-sky-400',
  positive: 'text-teal-600 dark:text-teal-400',
  income: 'text-sky-600 dark:text-sky-400',
  savings: 'text-teal-600 dark:text-teal-400',
  expense: 'text-orange-500 dark:text-orange-400',
  leisure: 'text-amber-500 dark:text-amber-400',
  warn: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400',
  liability: 'text-red-600 dark:text-red-400',
};

const ACCENT_BORDER = {
  netWorth: 'border-t-emerald-500',
  assets: 'border-t-sky-500',
  income: 'border-t-sky-500',
  savings: 'border-t-teal-500',
  expense: 'border-t-orange-500',
  leisure: 'border-t-amber-500',
  positive: 'border-t-teal-500',
  warn: 'border-t-amber-500',
  danger: 'border-t-red-500',
  default: 'border-t-slate-300 dark:border-t-slate-600',
  liability: 'border-t-red-500',
};

export function getKpiValueClass(tone = 'default') {
  return KPI_VALUE_TONE_CLASS[tone] ?? KPI_VALUE_TONE_CLASS.default;
}

export function KpiCard({
  label,
  value,
  valueTone = 'default',
  subValue,
  subTone,
  hint,
  trend,
  accent = false,
  hideFooter = false,
  compact = false,
}) {
  const valueClass = getKpiValueClass(valueTone);
  const subClass =
    subTone === 'muted'
      ? ui.textMuted
      : getKpiValueClass(subTone ?? valueTone);
  const accentClass = accent
    ? `border-t-[3px] ${ACCENT_BORDER[valueTone] ?? ACCENT_BORDER.default}`
    : '';
  const valueSize = compact
    ? 'text-lg font-semibold'
    : 'text-2xl font-semibold tracking-[-0.024em] sm:text-[1.65rem]';

  return (
    <article
      className={`${compact ? `${ui.block} px-3 py-2.5` : ui.kpiCard} ${accentClass}`}
    >
      <p
        className={`font-medium ${ui.textMuted} ${compact ? 'text-xs' : 'text-sm'}`}
      >
        {label}
      </p>
      <p
        className={`tabular-nums ${valueSize} ${valueClass} ${
          compact ? 'mt-1' : 'mt-2'
        }`}
      >
        {value}
      </p>
      {subValue ? (
        <p className={`mt-1.5 text-sm font-medium tabular-nums ${subClass}`}>
          {subValue}
        </p>
      ) : trend ? (
        <p
          className={`mt-2 flex items-center gap-1 text-sm font-medium ${
            trend.tone === 'positive'
              ? KPI_VALUE_TONE_CLASS.positive
              : KPI_VALUE_TONE_CLASS.danger
          }`}
        >
          <span aria-hidden>{trend.arrow}</span>
          <span>{trend.text}</span>
        </p>
      ) : hint ? (
        <p className={`mt-1 text-xs leading-snug ${ui.textMuted}`}>{hint}</p>
      ) : hideFooter ? null : (
        <p className={`mt-2 text-sm ${ui.textMuted}`}>—</p>
      )}
    </article>
  );
}
