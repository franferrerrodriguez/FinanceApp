import { useCallback, useState } from 'react';
import { HelpTooltip } from '../../../components/HelpTooltip';
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

  return (
    <div className="block">
      <span
        className={`mb-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm font-medium ${ui.textLabel}`}
      >
        <label htmlFor={fieldId} className="inline-flex items-center gap-1">
          {label}
          {required && <span className="text-emerald-500">*</span>}
        </label>
        {help && (
          <HelpTooltip ariaLabel={helpAriaLabel}>{help}</HelpTooltip>
        )}
      </span>
      {hint && <p className={`mb-2 text-xs ${ui.textMuted}`}>{hint}</p>}
      <div className="relative">
        <span
          className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${ui.textMuted}`}
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
          className={`${ui.input} ${ui.inputMoney}`}
        />
      </div>
    </div>
  );
}

/** @deprecated Usa parseMoneyEuros desde lib/money */
export const parseMoney = parseMoneyEuros;
