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
  layout = 'stacked',
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
