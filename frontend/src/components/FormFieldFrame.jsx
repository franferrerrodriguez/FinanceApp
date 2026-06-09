import { ui } from '../lib/uiClasses';

/**
 * Label + hint + control.
 * - stacked (default): tight vertical rhythm for forms and sections.
 * - grid: fixed label/hint slots so inputs align in multi-column grids.
 */
export function FormFieldFrame({
  label,
  hint,
  required = false,
  children,
  className = '',
  controlClassName = '',
  layout = 'stacked',
  /** @deprecated Use layout="grid" */
  compact = undefined,
  /** Grid only: reserve hint row when hint is empty */
  reserveHintSpace = true,
}) {
  const resolvedLayout =
    compact === true ? 'stacked' : compact === false ? 'grid' : layout;
  const isGrid = resolvedLayout === 'grid';

  return (
    <div className={`flex min-w-0 flex-col ${className}`}>
      <span
        className={
          isGrid
            ? `block text-sm font-medium leading-snug ${ui.textLabel} ${
                reserveHintSpace || hint ? ui.formFieldLabel : 'mb-1.5'
              }`
            : `mb-1 block text-sm font-medium leading-snug ${ui.textLabel}`
        }
      >
        {label}
        {required ? <span className="text-emerald-500"> *</span> : null}
      </span>
      {isGrid ? (
        reserveHintSpace || hint ? (
          <p
            className={`${ui.formFieldHint} ${ui.textMuted} ${hint ? '' : 'invisible'}`}
            aria-hidden={!hint}
            title={hint || undefined}
          >
            {hint || '\u00a0'}
          </p>
        ) : null
      ) : hint ? (
        <p className={`mb-2 text-xs leading-relaxed ${ui.textMuted}`}>{hint}</p>
      ) : null}
      <div className={controlClassName || undefined}>{children}</div>
    </div>
  );
}
