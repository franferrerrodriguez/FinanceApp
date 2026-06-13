import { useTranslation } from 'react-i18next';
import { ui } from '../../../lib/uiClasses';
import { ONBOARDING_STEP_IDS } from '../constants';

export function StepHeader({ stepIndex }) {
  const { t } = useTranslation();
  const total = ONBOARDING_STEP_IDS.length;
  const progress = ((stepIndex + 1) / total) * 100;

  return (
    <div className="mb-8">
      <div className="mb-3 text-sm">
        <span className="rounded-full bg-[var(--accent-muted)] px-2.5 py-0.5 text-[0.8125rem] font-medium tracking-[-0.01em] text-[var(--accent)]">
          {t('onboarding.stepProgress', { current: stepIndex + 1, total })}
        </span>
      </div>
      <div className={ui.progressTrack}>
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-3 flex gap-1">
        {ONBOARDING_STEP_IDS.map((id, i) => (
          <span
            key={id}
            className={`flex-1 truncate text-center text-[0.6875rem] font-medium tracking-[-0.01em] sm:text-xs ${
              i === stepIndex
                ? 'font-semibold text-[var(--accent)]'
                : i < stepIndex
                  ? 'text-[var(--accent-light)] opacity-70'
                  : 'font-normal text-[var(--text-disabled)]'
            }`}
          >
            {t(`onboarding.steps.${id}.short`)}
          </span>
        ))}
      </div>
    </div>
  );
}
