import { useTranslation } from 'react-i18next';
import { ui } from '../../../lib/uiClasses';

export function OnboardingActions({
  onBack,
  onNext,
  nextLabel,
  nextDisabled = false,
  showBack = true,
}) {
  const { t } = useTranslation();
  const primaryLabel = nextLabel ?? t('common.continue');

  return (
    <div className="mt-8 flex gap-3">
      {showBack && onBack && (
        <button
          type="button"
          onClick={onBack}
          className={`flex-1 ${ui.btnSecondary}`}
        >
          {t('common.back')}
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className={`flex-[2] ${ui.btnPrimary}`}
      >
        {primaryLabel}
      </button>
    </div>
  );
}
