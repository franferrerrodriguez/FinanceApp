import { FormFieldFrame } from './FormFieldFrame';
import { ui } from '../lib/uiClasses';

export function TextField({
  id,
  label,
  hint,
  value,
  onChange,
  type = 'text',
  required = false,
  error = false,
  errorMessage,
  inputMode,
  autoComplete,
  placeholder,
  autoFocus,
  min,
  max,
  narrow = false,
  compact = false,
  layout = 'stacked',
  reserveHintSpace,
  className = '',
  describedBy,
}) {
  const fieldId =
    id ??
    (typeof label === 'string'
      ? label.toLowerCase().replace(/\s+/g, '-')
      : 'text-field');

  const inputClass = `${error ? ui.inputError : ui.input} ${
    narrow ? ui.inputNarrow : ''
  } w-full`;

  const resolvedLayout =
    compact === true ? 'stacked' : compact === false ? 'grid' : layout;

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
      <input
        id={fieldId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        autoFocus={autoFocus}
        min={min}
        max={max}
        aria-invalid={error || undefined}
        aria-describedby={describedBy}
        className={inputClass}
      />
      {error && errorMessage ? (
        <p className="mt-2 text-sm text-[var(--color-negative)]" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </FormFieldFrame>
  );
}
