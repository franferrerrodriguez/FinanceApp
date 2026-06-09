import { useCallback, useState } from 'react';
import { clampPercent } from '../../../lib/money';
import { ui } from '../../../lib/uiClasses';

export function SharePercentInput({ id, value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const displayValue = editing ? draft : String(value ?? 50);

  const commit = useCallback(
    (raw) => {
      if (raw === '' || raw === '-') return;
      const n = parseInt(raw, 10);
      if (Number.isFinite(n)) {
        onChange(clampPercent(n));
      }
    },
    [onChange],
  );

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={displayValue}
      onFocus={() => {
        setEditing(true);
        setDraft(String(value ?? ''));
      }}
      onBlur={() => {
        setEditing(false);
        if (draft === '') {
          onChange(value ?? 50);
          return;
        }
        commit(draft);
      }}
      onChange={(e) => {
        const raw = e.target.value.replace(/\D/g, '');
        setDraft(raw);
        if (raw !== '') commit(raw);
      }}
      className={`${ui.inputPercent} min-w-[5.5rem] text-center`}
    />
  );
}
