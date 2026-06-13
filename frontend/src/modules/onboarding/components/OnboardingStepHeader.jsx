import { ui } from '../../../lib/uiClasses';

export function OnboardingStepHeader({
  title,
  subtitle,
  variant = 'default',
  className = '',
}) {
  const isHero = variant === 'hero';

  return (
    <header className={className}>
      <h2
        className={
          isHero
            ? `mb-4 ${ui.displayTitle}`
            : `mb-2 text-2xl font-semibold ${ui.heading}`
        }
      >
        {title}
      </h2>
      {subtitle ? (
        <p className={isHero ? `mb-8 max-w-[22em] ${ui.displaySubtitle}` : `mb-6 ${ui.text}`}>
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
