import { FormFieldFrame } from './FormFieldFrame';
import { ui } from '../lib/uiClasses';

export function DateField({
  id,
  label,
  hint,
  value,
  onChange,
  required = false,
  compact = false,
  reserveHintSpace,
  className = '',
}) {
  const fieldId =
    id ??
    (typeof label === 'string'
      ? label.toLowerCase().replace(/\s+/g, '-')
      : 'date-field');

  return (
    <FormFieldFrame
      label={label}
      hint={hint}
      required={required}
      compact={compact}
      reserveHintSpace={reserveHintSpace ?? !compact}
      className={className}
      controlClassName={compact ? '' : ui.formFieldControl}
    >
      <input
        id={fieldId}
        type="date"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={`${ui.input} w-full max-w-none sm:max-w-[12rem]`}
      />
    </FormFieldFrame>
  );
}
