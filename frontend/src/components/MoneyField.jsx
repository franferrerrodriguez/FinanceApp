import { parseMoneyEuros } from '../lib/money';
import { ui } from '../lib/uiClasses';
import { FormFieldFrame } from './FormFieldFrame';
import { HelpTooltip } from './HelpTooltip';
import { MoneyInput } from './MoneyInput';

export function MoneyField({
  label,
  hint,
  help,
  helpAriaLabel,
  value,
  onChange,
  required = false,
  id,
  className = '',
  compact = false,
  fullWidth = false,
  disabled = false,
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
    />
  );

  const hintSpace = reserveHintSpace ?? !compact;

  if (compact) {
    return (
      <FormFieldFrame
        label={labelNode}
        hint={hint}
        required={required}
        compact
        className={className}
      >
        {input}
      </FormFieldFrame>
    );
  }

  return (
    <FormFieldFrame
      label={labelNode}
      hint={hint}
      required={required}
      className={className}
      reserveHintSpace={hintSpace}
      controlClassName={ui.formFieldControl}
    >
      {input}
    </FormFieldFrame>
  );
}

/** @deprecated Use parseMoneyEuros from lib/money */
export const parseMoney = parseMoneyEuros;
