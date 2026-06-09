import { useTranslation } from 'react-i18next';
import { ui } from '../../../lib/uiClasses';
import { ONBOARDING_STEP_IDS } from '../constants';

export function StepHeader({ stepIndex }) {
  const { t } = useTranslation();
  const total = ONBOARDING_STEP_IDS.length;
  const progress = ((stepIndex + 1) / total) * 100;

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 font-medium text-emerald-600 dark:text-emerald-400">
          {t('onboarding.stepProgress', { current: stepIndex + 1, total })}
        </span>
        <span className={ui.textMuted}>
          {t(`onboarding.steps.${stepIndex}.title`)}
        </span>
      </div>
      <div className={ui.progressTrack}>
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-3 flex gap-1">
        {ONBOARDING_STEP_IDS.map((id, i) => (
          <span
            key={id}
            className={`flex-1 truncate text-center text-[0.65rem] sm:text-xs ${
              i === stepIndex
                ? 'font-semibold text-emerald-600 dark:text-emerald-400'
                : i < stepIndex
                  ? 'text-emerald-600/70 dark:text-emerald-400/70'
                  : 'text-slate-400 dark:text-slate-600'
            }`}
          >
            {t(`onboarding.steps.${id}.short`)}
          </span>
        ))}
      </div>
    </div>
  );
}
