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
    ? `${ui.input} ${ui.inputMoney} w-full max-w-none border-emerald-500/50 bg-emerald-500/[0.04] ring-1 ring-emerald-500/25 focus:border-emerald-500 dark:border-emerald-500/45 dark:bg-emerald-950/20`
    : prefilled
      ? `${ui.input} ${ui.inputMoney} w-full max-w-none border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300`
      : `${ui.input} ${ui.inputMoney} w-full max-w-none`;

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
          compact ? `${ui.inputCompact} pl-8` : 'pl-9'
        }${disabled ? ' opacity-60' : ''}`}
      />
      {hint ? (
        <p className={`mt-1 text-[11px] leading-snug ${ui.textMuted}`}>{hint}</p>
      ) : null}
    </div>
  );
}
