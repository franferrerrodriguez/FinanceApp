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

/** Shared KPI value colors — map to DS semantic tokens. */
export const KPI_VALUE_TONE_CLASS = {
  default: ui.heading,
  netWorth: 'text-[var(--color-positive)]',
  assets: 'text-[var(--color-info)]',
  positive: 'text-[var(--color-positive)]',
  income: 'text-[var(--color-info)]',
  savings: 'text-[var(--color-positive)]',
  expense: 'text-[var(--color-negative)]',
  leisure: 'text-[var(--color-warning)]',
  warn: 'text-[var(--color-warning)]',
  danger: 'text-[var(--color-negative)]',
  liability: 'text-[var(--color-negative)]',
};

const ACCENT_BORDER = {
  netWorth: 'border-t-[var(--color-positive)]',
  assets: 'border-t-[var(--color-info)]',
  income: 'border-t-[var(--color-info)]',
  savings: 'border-t-[var(--color-positive)]',
  expense: 'border-t-[var(--color-negative)]',
  leisure: 'border-t-[var(--color-warning)]',
  positive: 'border-t-[var(--color-positive)]',
  warn: 'border-t-[var(--color-warning)]',
  danger: 'border-t-[var(--color-negative)]',
  default: 'border-t-[rgba(255,255,255,0.18)]',
  liability: 'border-t-[var(--color-negative)]',
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
