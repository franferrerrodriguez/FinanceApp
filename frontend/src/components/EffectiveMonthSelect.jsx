import { useMemo } from 'react';
import { buildEffectiveMonthOptions } from '../lib/cashflowHistory';
import { SelectField } from './SelectField';

/** Compact month dropdown for cashflow tramos (no month carousel). */
export function EffectiveMonthSelect({
  value,
  onChange,
  extraMonthKeys = [],
  lookbackMonths = 36,
  id,
  ariaLabel,
  className = '',
  wrapperClassName = '',
}) {
  const options = useMemo(
    () => buildEffectiveMonthOptions(extraMonthKeys, lookbackMonths),
    [extraMonthKeys, lookbackMonths],
  );

  return (
    <SelectField
      id={id}
      variant="input"
      className={className}
      wrapperClassName={wrapperClassName}
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((monthKey) => (
        <option key={monthKey} value={monthKey}>
          {formatEffectiveMonthLabel(monthKey)}
        </option>
      ))}
    </SelectField>
  );
}

/** Short label for selects (e.g. 04/2026). */
export function formatEffectiveMonthLabel(monthKey) {
  const [y, m] = String(monthKey ?? '').split('-');
  if (!y || !m) return monthKey;
  return `${m}/${y}`;
}
