import { ui } from '../lib/uiClasses';

/** Section title + optional hint — same rhythm as FormFieldFrame (stacked). */
export function FormSectionHeader({ title, hint, accent, className = '' }) {
  return (
    <div className={className}>
      <p className={`text-sm font-medium leading-snug ${ui.textLabel}`}>{title}</p>
      {accent ? (
        <p className={`mt-1 text-sm italic leading-snug ${ui.accentSoft}`}>{accent}</p>
      ) : null}
      {hint ? (
        <p className={`mt-1 mb-2 text-xs leading-relaxed ${ui.textMuted}`}>{hint}</p>
      ) : (
        <div className="mb-2" aria-hidden />
      )}
    </div>
  );
}
