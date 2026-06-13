import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextField } from '../../../components/TextField';
import {
  PROFILE_AGE_ERROR_KEYS,
  PROFILE_MAX_AGE,
  PROFILE_MIN_AGE,
  validateProfileForm,
} from '../../../lib/profileValidation';
import { useProfile } from '../../../store/hooks';
import { ui } from '../../../lib/uiClasses';
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
    <div className="pt-2 sm:pt-6">
      <header className="mb-10">
        <p className={`mb-5 text-sm font-medium ${ui.accent}`}>{t('app.name')}</p>
        <h2 className={ui.displayTitle}>{t('onboarding.welcome.title')}</h2>
        <p className={`mt-4 max-w-[26em] ${ui.displaySubtitle}`}>
          {t('onboarding.welcome.subtitle')}
        </p>
        <p className={`mt-5 text-sm ${ui.textMuted}`}>{t('onboarding.welcome.scopes')}</p>
      </header>

      <div className="space-y-4">
        <TextField
          id="onboarding-name"
          label={t('onboarding.welcome.name')}
          value={name}
          onChange={setName}
          placeholder={t('onboarding.welcome.namePlaceholder')}
          autoComplete="name"
          required
          compact
          error={showNameError}
          errorMessage={
            showNameError ? t('onboarding.welcome.nameErrorRequired') : undefined
          }
        />

        <TextField
          id="onboarding-age"
          label={t('onboarding.welcome.age')}
          value={age}
          onChange={setAge}
          type="number"
          inputMode="numeric"
          min={PROFILE_MIN_AGE}
          max={PROFILE_MAX_AGE}
          placeholder={t('onboarding.welcome.agePlaceholder')}
          narrow
          required
          compact
          error={showAgeError}
          errorMessage={
            showAgeError && validation.ageErrorKey
              ? t(PROFILE_AGE_ERROR_KEYS[validation.ageErrorKey], {
                  min: PROFILE_MIN_AGE,
                  max: PROFILE_MAX_AGE,
                })
              : undefined
          }
        />
      </div>

      {showErrors && !canContinue ? (
        <p className="mt-4 text-sm text-[var(--color-warning)]" role="status">
          {t('onboarding.welcome.formIncomplete')}
        </p>
      ) : null}

      <OnboardingActions
        showBack={false}
        onNext={handleNext}
        nextLabel={t('common.start')}
      />

      <p className={`mt-6 text-center text-xs ${ui.textMuted}`}>
        {t('onboarding.stepProgress', { current: 1, total: 4 })}
      </p>
    </div>
  );
}
