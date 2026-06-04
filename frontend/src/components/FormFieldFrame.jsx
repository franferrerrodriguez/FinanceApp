import { ui } from '../lib/uiClasses';

/**
 * Shared label + hint + control slot so grid columns align across forms.
 * Label and hint use fixed two-line height so wrapped text does not shift inputs.
 */
export function FormFieldFrame({
  label,
  hint,
  required = false,
  children,
  className = '',
  controlClassName = ui.formFieldControl,
  /** When false, no hint row (use for stacked forms; avoids empty spacer in grids). */
  reserveHintSpace = true,
}) {
  const labelIsString = typeof label === 'string';
  const showHintRow = reserveHintSpace || hint;

  return (
    <div className={`flex min-w-0 flex-col ${className}`}>
      <span
        className={`block text-sm font-medium leading-snug ${ui.textLabel} ${
          showHintRow ? ui.formFieldLabel : 'mb-1.5'
        }`}
      >
        {label}
        {required && labelIsString ? (
          <span className="text-emerald-500"> *</span>
        ) : null}
      </span>
      {showHintRow ? (
        <p
          className={`${ui.formFieldHint} ${ui.textMuted} ${hint ? '' : 'invisible'}`}
          aria-hidden={!hint}
          title={hint || undefined}
        >
          {hint || '\u00a0'}
        </p>
      ) : null}
      <div className={controlClassName}>{children}</div>
    </div>
  );
}
