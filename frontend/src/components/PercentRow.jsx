import { ui } from '../lib/uiClasses';
import { displayToPct, pctToDisplay } from '../utils/formatters';

export { displayToPct, pctToDisplay };

export function PercentRow({ label, hint, value, onChange }) {
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
          type="number"
          step="0.01"
          min={0}
          max={30}
          value={pctToDisplay(value)}
          onChange={(e) => onChange(displayToPct(e.target.value))}
          className={`${ui.inputPercent} pr-9`}
        />
        <span className={`${ui.inputSuffixAdornment} ${ui.textMuted}`}>%</span>
      </div>
    </div>
  );
}
