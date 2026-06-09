import { displayToPct, pctToDisplay } from './PercentRow';
import { FormFieldFrame } from './FormFieldFrame';
import { ui } from '../lib/uiClasses';

export function PercentField({
  id,
  label,
  hint,
  value,
  onChange,
  min = 0,
  max = 30,
  step = 0.1,
  nullable = false,
  compact = false,
  layout = 'stacked',
  reserveHintSpace,
  className = '',
}) {
  const fieldId =
    id ??
    (typeof label === 'string'
      ? label.toLowerCase().replace(/\s+/g, '-')
      : 'percent-field');

  const resolvedLayout =
    compact === true ? 'stacked' : compact === false ? 'grid' : layout;

  const display = pctToDisplay(value);

  return (
    <FormFieldFrame
      label={label}
      hint={hint}
      layout={resolvedLayout}
      reserveHintSpace={reserveHintSpace ?? resolvedLayout === 'grid'}
      className={className}
      controlClassName={resolvedLayout === 'grid' ? ui.formFieldControl : ''}
    >
      <div className="relative inline-block w-full max-w-[5.5rem] shrink-0">
        <input
          id={fieldId}
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          max={max}
          value={nullable && value == null ? '' : display}
          onChange={(e) => {
            const raw = e.target.value;
            if (nullable && raw === '') {
              onChange(null);
              return;
            }
            onChange(displayToPct(raw));
          }}
          className={`${ui.inputPercent} w-full max-w-none pr-7`}
        />
        <span
          className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs ${ui.textMuted}`}
        >
          %
        </span>
      </div>
    </FormFieldFrame>
  );
}
