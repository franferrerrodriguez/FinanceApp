import { ui } from '../lib/uiClasses';

/** Bordered form block for onboarding and cashflow expense rows. */
export function FormSection({ children, className = '' }) {
  return (
    <div className={`${ui.block} space-y-4 p-4 ${className}`.trim()}>{children}</div>
  );
}
