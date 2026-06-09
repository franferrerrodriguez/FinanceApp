import { ui } from '../../../lib/uiClasses';

export function OnboardingStepHeader({ title, subtitle, className = '' }) {
  return (
    <header className={className}>
      <h2 className={`mb-2 text-2xl font-bold ${ui.heading}`}>{title}</h2>
      {subtitle ? <p className={`mb-6 ${ui.text}`}>{subtitle}</p> : null}
    </header>
  );
}
