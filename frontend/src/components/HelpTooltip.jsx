import { useId } from 'react';
import { ui } from '../lib/uiClasses';

export function HelpTooltip({ ariaLabel, children }) {
  const tooltipId = useId();

  return (
    <span className="group relative inline-flex align-middle">
      <span
        tabIndex={0}
        role="img"
        aria-label={ariaLabel}
        aria-describedby={tooltipId}
        className={`inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full border text-xs font-semibold transition hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 dark:hover:text-emerald-400 border-slate-400 text-slate-500 dark:border-slate-600 dark:text-slate-400`}
      >
        ?
      </span>

      <div
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none invisible absolute left-0 top-full z-50 w-[min(100vw-2rem,18rem)] pt-1.5 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        <div
          className={`rounded-xl border p-3 text-left text-xs leading-relaxed shadow-xl ${ui.card} ${ui.textLabel}`}
        >
          {children}
        </div>
      </div>
    </span>
  );
}
