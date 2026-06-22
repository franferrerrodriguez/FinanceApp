import { ui } from '../lib/uiClasses';
import { FormFieldFrame } from './FormFieldFrame';
import { HelpTooltip } from './HelpTooltip';
import { MoneyInput } from './MoneyInput';

export function MoneyField({
  label,
  hint,
  hintAfter,
  help,
  helpAriaLabel,
  value,
  onChange,
  required = false,
  id,
  className = '',
  compact = false,
  layout = 'stacked',
  fullWidth = false,
  disabled = false,
  error = false,
  reserveHintSpace,
}) {
  const fieldId =
    id ??
    (typeof label === 'string'
      ? label.toLowerCase().replace(/\s+/g, '-')
      : 'money-field');

  const labelNode = (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <span>{label}</span>
      {help ? (
        <HelpTooltip ariaLabel={helpAriaLabel}>{help}</HelpTooltip>
      ) : null}
    </span>
  );

  const input = (
    <MoneyInput
      id={fieldId}
      value={value}
      onChange={onChange}
      disabled={disabled}
      compact={compact}
      fullWidth={fullWidth}
      error={error}
    />
  );

  const hintSpace = reserveHintSpace ?? layout === 'grid';

  return (
    <FormFieldFrame
      label={labelNode}
      hint={hint}
      hintAfter={hintAfter}
      required={required}
      layout={layout}
      className={className}
      reserveHintSpace={hintSpace}
      controlClassName={layout === 'grid' ? ui.formFieldControl : ''}
    >
      {input}
    </FormFieldFrame>
  );
}

