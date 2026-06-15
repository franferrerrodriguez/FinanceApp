import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatMoneyInputValue, parseMoneyEuros } from '../lib/money';
import { ui } from '../lib/uiClasses';

/** Bare € input for lists and embedded rows (no label frame). */
export function MoneyInput({
  id,
  value,
  onChange,
  disabled = false,
  compact = false,
  fullWidth = false,
  prefilled = false,
  pending = false,
  error = false,
  hint,
  className = '',
  'aria-label': ariaLabel,
}) {
  const { i18n } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const formatDisplay = useCallback(
    (amount) => formatMoneyInputValue(amount, i18n.language),
    [i18n.language],
  );

  const commitDraft = useCallback(
    (raw) => {
      onChange(parseMoneyEuros(raw));
    },
    [onChange],
  );

  const displayValue = editing ? draft : formatDisplay(value);
  const widthClass = fullWidth ? 'w-full max-w-none' : `w-full ${ui.inputAmount}`;
  const inputClass = pending
    ? `${ui.input} ${ui.inputMoney} w-full max-w-none [border-color:rgba(29,158,117,0.40)] bg-[rgba(29,158,117,0.04)] ring-1 ring-[rgba(29,158,117,0.15)] focus:[border-color:var(--accent)]`
    : error
      ? `${ui.inputError} ${ui.inputMoney} w-full max-w-none`
      : prefilled
        ? `${ui.input} ${ui.inputMoney} w-full max-w-none [border-color:rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[var(--text-muted)]`
        : `${ui.input} ${ui.inputMoney} w-full max-w-none`;

  return (
    <div className={`relative ${widthClass} ${className}`.trim()}>
      <span className={`${ui.inputSuffixAdornment} ${ui.textMuted}`}>€</span>
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
          setDraft(formatDisplay(value));
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
        className={`${inputClass} ${
          compact ? `${ui.inputCompact} pr-8` : ''
        }${disabled ? ' opacity-60' : ''}`}
      />
      {hint ? (
        <p className={`mt-1 text-[11px] leading-snug ${ui.textMuted}`}>{hint}</p>
      ) : null}
    </div>
  );
}
