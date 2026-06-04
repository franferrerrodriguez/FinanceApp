import { ui } from '../lib/uiClasses';

const CHEVRON_INSET = 'right-3.5';

const VARIANT_CLASS = {
  field: ui.selectField,
  input: `${ui.input} ${ui.selectWithChevron}`,
  compact: `${ui.input} ${ui.inputCompact} ${ui.selectWithChevron}`,
  menu: `w-full ${ui.select} ${ui.selectWithChevron}`,
};

function ChevronIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** Native select with custom chevron and comfortable right padding (use for all dropdowns). */
export function SelectField({
  id,
  variant = 'field',
  className = '',
  wrapperClassName = '',
  children,
  ...props
}) {
  const base = VARIANT_CLASS[variant] ?? VARIANT_CLASS.field;

  return (
    <div className={`relative ${wrapperClassName}`}>
      <select
        id={id}
        className={`${base} ${className}`.trim()}
        {...props}
      >
        {children}
      </select>
      <span
        className={`pointer-events-none absolute inset-y-0 flex items-center ${CHEVRON_INSET} ${ui.selectChevron}`}
        aria-hidden
      >
        <ChevronIcon />
      </span>
    </div>
  );
}
