import { ui } from '../lib/uiClasses';

export function pctToDisplay(decimal) {
  return Math.round((decimal ?? 0) * 1000) / 10;
}

export function displayToPct(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n / 100 : 0;
}

export function PercentRow({ label, hint, value, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${ui.textLabel}`}>{label}</p>
        {hint ? (
          <p className={`mt-0.5 text-xs leading-snug ${ui.textMuted}`}>{hint}</p>
        ) : null}
      </div>
      <div className="relative w-[4.5rem] shrink-0">
        <input
          type="number"
          step="0.1"
          min={0}
          max={30}
          value={pctToDisplay(value)}
          onChange={(e) => onChange(displayToPct(e.target.value))}
          className={`${ui.input} ${ui.inputCompact} w-full py-2 pl-2 pr-6 text-right tabular-nums`}
        />
        <span
          className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs ${ui.textMuted}`}
        >
          %
        </span>
      </div>
    </div>
  );
}
