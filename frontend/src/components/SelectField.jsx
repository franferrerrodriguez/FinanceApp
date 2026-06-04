import { ui } from '../lib/uiClasses';

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

/** Select nativo con flecha visible y padding derecho cómodo. */
export function SelectField({ id, className = '', wrapperClassName = '', children, ...props }) {
  return (
    <div className={`relative ${wrapperClassName}`}>
      <select
        id={id}
        className={`${ui.selectField} ${className}`}
        {...props}
      >
        {children}
      </select>
      <span
        className={`pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 ${ui.selectChevron}`}
        aria-hidden
      >
        <ChevronIcon />
      </span>
    </div>
  );
}
