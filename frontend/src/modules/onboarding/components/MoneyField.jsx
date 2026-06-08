import { useCallback, useState } from 'react';
import { HelpTooltip } from '../../../components/HelpTooltip';
import { FormFieldFrame } from '../../../components/FormFieldFrame';
import { parseMoneyEuros } from '../../../lib/money';
import { ui } from '../../../lib/uiClasses';

function formatMoneyDisplay(value) {
  if (value == null || value === 0) return '';
  return String(value);
}

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
}) {
  const fieldId =
    id ??
    (typeof label === 'string'
      ? label.toLowerCase().replace(/\s+/g, '-')
      : 'money-field');

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const commitDraft = useCallback(
    (raw) => {
      onChange(parseMoneyEuros(raw));
    },
    [onChange],
  );

  const displayValue = editing ? draft : formatMoneyDisplay(value);

  const labelNode = (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <label htmlFor={fieldId} className="inline-flex items-center gap-1">
        {label}
      </label>
      {help ? (
        <HelpTooltip ariaLabel={helpAriaLabel}>{help}</HelpTooltip>
      ) : null}
    </span>
  );

  const inputBlock = (
    <div className={`relative ${fullWidth ? 'w-full' : 'max-w-[12rem]'}`}>
      <span
        className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm ${ui.textMuted}`}
      >
        €
      </span>
      <input
        id={fieldId}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onFocus={() => {
          setEditing(true);
          setDraft(formatMoneyDisplay(value));
        }}
        onBlur={() => {
          setEditing(false);
          commitDraft(draft);
        }}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d.,]/g, '');
          setDraft(raw);
          commitDraft(raw);
        }}
        placeholder="0"
        className={`${ui.input} ${ui.inputMoney} w-full max-w-none ${
          compact
            ? 'h-10 min-h-0 py-2 pl-8 text-sm'
            : 'h-11 min-h-[2.75rem] pl-9'
        }`}
      />
    </div>
  );

  if (compact) {
    return (
      <div className={className}>
        <label
          htmlFor={fieldId}
          className={`mb-1 block text-sm font-medium leading-snug ${ui.textLabel}`}
        >
          {label}
          {required ? <span className="text-emerald-500"> *</span> : null}
        </label>
        {hint ? (
          <p className={`mb-1.5 text-xs leading-relaxed ${ui.textMuted}`}>{hint}</p>
        ) : null}
        {inputBlock}
      </div>
    );
  }

  return (
    <FormFieldFrame
      label={labelNode}
      hint={hint}
      required={required}
      className={className}
      controlClassName={ui.formFieldControl}
      reserveHintSpace={Boolean(hint)}
    >
      {inputBlock}
    </FormFieldFrame>
  );
}

/** @deprecated Use parseMoneyEuros from lib/money */
export const parseMoney = parseMoneyEuros;
