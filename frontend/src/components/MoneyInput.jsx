import { useCallback, useState } from 'react';
import { parseMoneyEuros } from '../lib/money';
import { ui } from '../lib/uiClasses';

function formatMoneyDisplay(value) {
  if (value == null || value === 0) return '';
  return String(value);
}

/** Bare € input for lists and embedded rows (no label frame). */
export function MoneyInput({
  id,
  value,
  onChange,
  disabled = false,
  compact = false,
  fullWidth = false,
  className = '',
  'aria-label': ariaLabel,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const commitDraft = useCallback(
    (raw) => {
      onChange(parseMoneyEuros(raw));
    },
    [onChange],
  );

  const displayValue = editing ? draft : formatMoneyDisplay(value);
  const widthClass = fullWidth ? 'w-full max-w-none' : `w-full ${ui.inputAmount}`;

  return (
    <div className={`relative ${widthClass} ${className}`.trim()}>
      <span
        className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm ${ui.textMuted}`}
      >
        €
      </span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        disabled={disabled}
        aria-label={ariaLabel}
        value={displayValue}
        onFocus={() => {
          if (disabled) return;
          setEditing(true);
          setDraft(formatMoneyDisplay(value));
        }}
        onBlur={() => {
          setEditing(false);
          commitDraft(draft);
        }}
        onChange={(e) => {
          if (disabled) return;
          const raw = e.target.value.replace(/[^\d.,]/g, '');
          setDraft(raw);
          commitDraft(raw);
        }}
        placeholder="0"
        className={`${ui.input} ${ui.inputMoney} w-full max-w-none ${
          compact ? `${ui.inputCompact} pl-8` : 'pl-9'
        }${disabled ? ' opacity-60' : ''}`}
      />
    </div>
  );
}
