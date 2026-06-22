import { ui } from '../lib/uiClasses';
import { HelpTooltip } from './HelpTooltip';
import { getKpiValueClass, KPI_VALUE_TONE_CLASS } from './kpiTones';

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
  help,
  helpAria,
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
        className={`flex items-center gap-1 font-medium ${ui.textMuted} ${compact ? 'text-xs' : 'text-sm'}`}
      >
        {label}
        {help ? <HelpTooltip ariaLabel={helpAria ?? label}>{help}</HelpTooltip> : null}
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
