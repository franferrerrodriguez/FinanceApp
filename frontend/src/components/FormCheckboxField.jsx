import { ui } from '../lib/uiClasses';

export function FormCheckboxField({
  id,
  checked,
  onChange,
  label,
  hint,
  className = '',
}) {
  return (
    <label
      htmlFor={id}
      className={`flex min-h-11 cursor-pointer items-start gap-3 py-1 ${className}`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={`${ui.checkbox} mt-0.5`}
      />
      <span className="min-w-0 flex-1">
        <span className={`block text-sm leading-snug ${ui.textLabel}`}>{label}</span>
        {hint ? (
          <span className={`mt-1 block text-xs leading-relaxed ${ui.textMuted}`}>
            {hint}
          </span>
        ) : null}
      </span>
    </label>
  );
}
