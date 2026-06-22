import { useCallback } from 'react';
import { ui } from '../lib/uiClasses';
import { useDecimalInput } from '../hooks/useDecimalInput';
import { pctToDisplay } from '../utils/formatters';

export function PercentRow({ label, hint, value, onChange }) {
  const toDisplay = useCallback((v) => {
    const d = pctToDisplay(v ?? 0);
    return Number.isFinite(d) ? d : 0;
  }, []);

  const fromDisplay = useCallback((s) => {
    const n = parseFloat(s);
    return Number.isFinite(n) ? n / 100 : null;
  }, []);

  const { inputValue, handleChange, handleFocus, handleBlur } = useDecimalInput(
    value,
    onChange,
    { nullable: false, toDisplay, fromDisplay },
  );

  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${ui.textLabel}`}>{label}</p>
        {hint ? (
          <p className={`mt-0.5 text-xs leading-snug ${ui.textMuted}`}>{hint}</p>
        ) : null}
      </div>
      <div className="relative shrink-0">
        <input
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`${ui.inputPercent} pr-9`}
        />
        <span className={`${ui.inputSuffixAdornment} ${ui.textMuted}`}>%</span>
      </div>
    </div>
  );
}
