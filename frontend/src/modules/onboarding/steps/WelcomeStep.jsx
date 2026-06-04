import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PROFILE_AGE_ERROR_KEYS,
  PROFILE_MAX_AGE,
  PROFILE_MIN_AGE,
  validateProfileForm,
} from '../../../lib/profileValidation';
import { ui } from '../../../lib/uiClasses';
import { useProfile } from '../../../store/hooks';
import { OnboardingActions } from '../components/OnboardingActions';

export function WelcomeStep({ onNext }) {
  const { t } = useTranslation();
  const { profile, setProfile } = useProfile();
  const [name, setName] = useState(profile?.name ?? '');
  const [age, setAge] = useState(profile?.age?.toString() ?? '');
  const [showErrors, setShowErrors] = useState(false);

  const validation = validateProfileForm({ name, age });
  const showNameError = showErrors && validation.nameMissing;
  const showAgeError =
    (showErrors && validation.ageErrorKey === 'required') ||
    (age.trim().length > 0 && validation.ageErrorKey != null);

  const canContinue = validation.valid;
  const inputClass = (hasError) => (hasError ? ui.inputError : ui.input);

  const handleNext = () => {
    if (!canContinue) {
      setShowErrors(true);
      return;
    }
    setProfile({
      ...profile,
      name: validation.name,
      age: validation.age,
    });
    onNext();
  };

  return (
    <>
      <h2 className={`mb-2 text-3xl font-bold ${ui.heading}`}>
        {t('onboarding.welcome.title')}
      </h2>
      <p className={`mb-8 ${ui.text}`}>{t('onboarding.welcome.subtitle')}</p>

      <div className="space-y-5">
        <label className="block">
          <span className={`mb-1.5 block text-sm font-medium ${ui.textLabel}`}>
            {t('onboarding.welcome.name')}{' '}
            <span className="text-emerald-500">{t('common.required')}</span>
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('onboarding.welcome.namePlaceholder')}
            className={inputClass(showNameError)}
            autoComplete="name"
            aria-invalid={showNameError}
            aria-describedby={showNameError ? 'name-error' : undefined}
          />
          {showNameError && (
            <p id="name-error" className="mt-2 text-sm text-red-500" role="alert">
              {t('onboarding.welcome.nameErrorRequired')}
            </p>
          )}
        </label>

        <label className="block">
          <span className={`mb-1.5 block text-sm font-medium ${ui.textLabel}`}>
            {t('onboarding.welcome.age')}{' '}
            <span className="text-emerald-500">{t('common.required')}</span>
          </span>
          <p className={`mb-2 text-xs ${ui.textMuted}`}>
            {t('onboarding.welcome.ageHint')}
          </p>
          <input
            type="number"
            min={PROFILE_MIN_AGE}
            max={PROFILE_MAX_AGE}
            inputMode="numeric"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder={t('onboarding.welcome.agePlaceholder')}
            className={`${inputClass(showAgeError)} ${ui.inputNarrow}`}
            aria-invalid={showAgeError}
            aria-describedby={showAgeError ? 'age-error' : undefined}
          />
          {showAgeError && validation.ageErrorKey && (
            <p id="age-error" className="mt-2 text-sm text-red-500" role="alert">
              {t(PROFILE_AGE_ERROR_KEYS[validation.ageErrorKey], {
                min: PROFILE_MIN_AGE,
                max: PROFILE_MAX_AGE,
              })}
            </p>
          )}
        </label>
      </div>

      {showErrors && !canContinue && (
        <p className="mt-4 text-sm text-amber-600 dark:text-amber-400/90" role="status">
          {t('onboarding.welcome.formIncomplete')}
        </p>
      )}

      <OnboardingActions
        showBack={false}
        onNext={handleNext}
        nextLabel={t('common.start')}
      />
    </>
  );
}
