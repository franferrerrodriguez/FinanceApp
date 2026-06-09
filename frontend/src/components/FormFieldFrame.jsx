import { ui } from '../lib/uiClasses';

/**
 * Label + hint + control.
 * - stacked (default): tight vertical rhythm for forms and sections.
 * - grid: optional fixed label/hint slots so inputs align in multi-column grids.
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
  const reserveHintSlot = isGrid && reserveHintSpace;
  const showHint = Boolean(hint) || reserveHintSlot;

  const labelClass = [
    ui.formFieldLabel,
    ui.textLabel,
    reserveHintSlot ? ui.formFieldLabelGridSlot : '',
    !showHint ? ui.formFieldHintAfter : '',
  ]
    .filter(Boolean)
    .join(' ');

  const hintClass = [
    ui.formFieldHint,
    ui.textMuted,
    ui.formFieldHintGap,
    ui.formFieldHintAfter,
    reserveHintSlot ? ui.formFieldHintGridSlot : '',
    !hint ? 'invisible pointer-events-none select-none' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`flex min-w-0 flex-col ${className}`}>
      <span className={labelClass}>
        {label}
        {required ? <span className="text-emerald-500"> *</span> : null}
      </span>
      {showHint ? (
        <p
          className={hintClass}
          aria-hidden={!hint}
          title={hint || undefined}
        >
          {hint || '\u00a0'}
        </p>
      ) : null}
      <div className={controlClassName || undefined}>{children}</div>
    </div>
  );
}
