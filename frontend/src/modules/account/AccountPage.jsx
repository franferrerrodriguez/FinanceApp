import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { isAuthAvailable } from '../../lib/auth';
import { isSimpleAuthMode } from '../../lib/authConfig';
import { flushCloudAutoSync } from '../../lib/cloudSync';
import {
  PROFILE_AGE_ERROR_KEYS,
  PROFILE_MAX_AGE,
  PROFILE_MIN_AGE,
  validateProfileForm,
} from '../../lib/profileValidation';
import { NotificationPermissionBanner } from '../../components/NotificationPermissionBanner';
import { TextField } from '../../components/TextField';
import { ui } from '../../lib/uiClasses';
import { getDisplayName } from '../../lib/userDisplay';
import { useProfile, useSessionMeta } from '../../store/hooks';
import { useToast } from '../../context/ToastContext';
export function AccountPage() {
  const { t } = useTranslation();
  const { profile, setProfile } = useProfile();
  const { user } = useSessionMeta();
  const [name, setName] = useState(profile?.name ?? '');
  const [age, setAge] = useState(profile?.age?.toString() ?? '');
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const cloudEnabled = isAuthAvailable() && !isSimpleAuthMode();

  useEffect(() => {
    setName(profile?.name ?? '');
    setAge(profile?.age?.toString() ?? '');
  }, [profile?.name, profile?.age]);

  const validation = validateProfileForm({ name, age });
  const showNameError = showErrors && validation.nameMissing;
  const showAgeError =
    (showErrors && validation.ageErrorKey === 'required') ||
    (age.trim().length > 0 && validation.ageErrorKey != null);

  const handleSave = async () => {
    if (!validation.valid) {
      setShowErrors(true);
      return;
    }

    setSaving(true);
    setProfile({ name: validation.name, age: validation.age });

    let cloudOk = true;
    if (cloudEnabled && user?.id) {
      const result = await flushCloudAutoSync();
      cloudOk = result.ok;
    }

    setSaving(false);
    if (cloudEnabled && !cloudOk) {
      toast.error(t('account.saveCloudError'));
    } else {
      toast.success(t('toast.profileSaved'));
    }
  };

  const displayName = getDisplayName({
    profile: { name: validation.name || profile?.name },
    user,
    fallback: t('dashboard.profileFallback'),
  });

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <Link
        to="/dashboard"
        className={`mb-6 inline-flex items-center gap-1 text-sm font-medium ${ui.textMuted} transition hover:text-emerald-600 dark:hover:text-emerald-400`}
      >
        <span aria-hidden>←</span>
        {t('account.back')}
      </Link>

      <header className="mb-8">
        <h1 className={ui.pageTitle}>{t('account.title')}</h1>
        <p className={`mt-1 text-sm ${ui.textMuted}`}>{t('account.subtitle')}</p>
      </header>

      <div className="space-y-6">
        <NotificationPermissionBanner />

        <section className={ui.chartCard}>
          <h2 className={`text-base font-semibold ${ui.heading}`}>
            {t('account.profile.title')}
          </h2>
          <p className={`mt-1 text-sm ${ui.textMuted}`}>{t('account.profile.hint')}</p>

          <div className="mt-5 space-y-4">
            <TextField
              id="account-name"
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
              id="account-age"
              label={t('onboarding.welcome.age')}
              hint={t('onboarding.welcome.ageHint')}
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
        </section>

        <section className={ui.chartCard}>
          <h2 className={`text-base font-semibold ${ui.heading}`}>
            {t('account.session.title')}
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className={ui.textMuted}>{t('account.session.displayName')}</dt>
              <dd className={`mt-0.5 font-medium ${ui.heading}`}>{displayName}</dd>
            </div>
            <div>
              <dt className={ui.textMuted}>{t('account.session.email')}</dt>
              <dd className={`mt-0.5 font-medium ${ui.heading}`}>
                {user?.email ?? '—'}
              </dd>
            </div>
          </dl>
        </section>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className={ui.btnPrimary}
          >
            {saving ? t('account.saving') : t('account.save')}
          </button>
          <Link to="/dashboard" className={ui.btnSecondary}>
            {t('common.back')}
          </Link>
        </div>
      </div>
    </div>
  );
}
