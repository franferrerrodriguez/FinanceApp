import { FormFieldFrame } from './FormFieldFrame';
import { SelectField } from './SelectField';
import { ui } from '../lib/uiClasses';

export function SelectFormField({
  id,
  label,
  hint,
  value,
  onChange,
  children,
  required = false,
  compact = false,
  className = '',
  selectClassName = '',
  disabled = false,
  reserveHintSpace,
}) {
  const fieldId =
    id ??
    (typeof label === 'string'
      ? label.toLowerCase().replace(/\s+/g, '-')
      : 'select-field');

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
      <SelectField
        id={fieldId}
        variant="input"
        className={`w-full py-2.5 ${selectClassName}`.trim()}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </SelectField>
    </FormFieldFrame>
  );
}
