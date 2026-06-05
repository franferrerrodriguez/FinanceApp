import { DEFAULT_SETTINGS } from '../lib/constants';
import { ui } from '../lib/uiClasses';

export function getSavingsTone(rate) {
  if (rate >= DEFAULT_SETTINGS.SAVINGS_RATE_GREEN) return 'savings';
  if (rate >= DEFAULT_SETTINGS.SAVINGS_RATE_YELLOW) return 'warn';
  return 'danger';
}

const VALUE_TONE_CLASS = {
  default: ui.heading,
  positive: 'text-teal-600 dark:text-teal-400',
  income: 'text-sky-600 dark:text-sky-400',
  savings: 'text-teal-600 dark:text-teal-400',
  expense: 'text-orange-500 dark:text-orange-400',
  leisure: 'text-amber-500 dark:text-amber-400',
  warn: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-500 dark:text-red-400',
  liability: 'text-orange-500 dark:text-orange-400',
};

const ACCENT_BORDER = {
  income: 'border-t-sky-500',
  savings: 'border-t-teal-500',
  expense: 'border-t-orange-500',
  leisure: 'border-t-amber-500',
  positive: 'border-t-teal-500',
  warn: 'border-t-amber-500',
  danger: 'border-t-red-500',
  default: 'border-t-slate-300 dark:border-t-slate-600',
  liability: 'border-t-orange-500',
};

export function KpiCard({
  label,
  value,
  valueTone = 'default',
  subValue,
  subTone,
  trend,
  accent = false,
  hideFooter = false,
}) {
  const valueClass = VALUE_TONE_CLASS[valueTone] ?? VALUE_TONE_CLASS.default;
  const subClass =
    VALUE_TONE_CLASS[subTone ?? valueTone] ?? ui.textMuted;
  const accentClass = accent
    ? `border-t-[3px] ${ACCENT_BORDER[valueTone] ?? ACCENT_BORDER.default}`
    : '';

  return (
    <article className={`${ui.kpiCard} ${accentClass}`}>
      <p className={`text-sm font-medium ${ui.textMuted}`}>{label}</p>
      <p
        className={`mt-2 text-2xl font-bold tracking-tight tabular-nums sm:text-[1.65rem] ${valueClass}`}
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
              ? VALUE_TONE_CLASS.positive
              : VALUE_TONE_CLASS.danger
          }`}
        >
          <span aria-hidden>{trend.arrow}</span>
          <span>{trend.text}</span>
        </p>
      ) : hideFooter ? null : (
        <p className={`mt-2 text-sm ${ui.textMuted}`}>—</p>
      )}
    </article>
  );
}
