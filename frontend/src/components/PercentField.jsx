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
  required = false,
  error = false,
  errorMessage,
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
      required={required}
      layout={resolvedLayout}
      reserveHintSpace={reserveHintSpace ?? resolvedLayout === 'grid'}
      className={className}
      controlClassName={resolvedLayout === 'grid' ? ui.formFieldControl : ''}
    >
      <div className="relative inline-block w-full max-w-[5.5rem] shrink-0">
        <input
          id={fieldId}
          type="text"
          inputMode="decimal"
          step={step}
          min={min}
          max={max}
          value={nullable && value == null ? '' : display}
          onChange={(e) => {
            const raw = e.target.value.replace(',', '.');
            if (nullable && (raw === '' || raw === '.')) {
              onChange(null);
              return;
            }
            onChange(displayToPct(raw));
          }}
          aria-invalid={error || undefined}
          className={`${error ? ui.inputError : ui.input} w-full max-w-none pr-9 tabular-nums`}
        />
        <span className={`${ui.inputSuffixAdornment} ${ui.textMuted}`}>%</span>
      </div>
      {error && errorMessage ? (
        <p className="mt-2 text-sm text-[var(--color-negative)]" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </FormFieldFrame>
  );
}
