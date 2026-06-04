import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { isAuthAvailable } from '../../lib/auth';
import { isSimpleAuthMode } from '../../lib/authConfig';
import { persistUserToSupabase } from '../../lib/persistUserToSupabase';
import {
  PROFILE_AGE_ERROR_KEYS,
  PROFILE_MAX_AGE,
  PROFILE_MIN_AGE,
  validateProfileForm,
} from '../../lib/profileValidation';
import { ui } from '../../lib/uiClasses';
import { getDisplayName } from '../../lib/userDisplay';
import { useProfile, useSessionMeta, useSettings } from '../../store/hooks';
import { FinancialParamsSection } from './components/FinancialParamsSection';

export function AccountPage() {
  const { t } = useTranslation();
  const { profile, setProfile } = useProfile();
  const { user, cloudSyncStatus } = useSessionMeta();
  const { settings } = useSettings();

  const [name, setName] = useState(profile?.name ?? '');
  const [age, setAge] = useState(profile?.age?.toString() ?? '');
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

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

  const inputClass = (hasError) => (hasError ? ui.inputError : ui.input);

  const handleSave = async () => {
    setSaveMessage(null);
    if (!validation.valid) {
      setShowErrors(true);
      return;
    }

    setSaving(true);
    setProfile({ name: validation.name, age: validation.age });

    let cloudOk = true;
    if (cloudEnabled && user?.id) {
      const result = await persistUserToSupabase(user.id);
      cloudOk = result.ok;
    }

    setSaving(false);
    if (cloudEnabled && !cloudOk) {
      setSaveMessage({ type: 'error', key: 'account.saveCloudError' });
    } else {
      setSaveMessage({ type: 'success', key: 'account.saveSuccess' });
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
        <h1 className={`text-2xl font-bold ${ui.heading}`}>{t('account.title')}</h1>
        <p className={`mt-1 text-sm ${ui.textMuted}`}>{t('account.subtitle')}</p>
      </header>

      <div className="space-y-6">
        <section className={ui.chartCard}>
          <h2 className={`text-base font-semibold ${ui.heading}`}>
            {t('account.profile.title')}
          </h2>
          <p className={`mt-1 text-sm ${ui.textMuted}`}>{t('account.profile.hint')}</p>

          <div className="mt-5 space-y-4">
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
              />
              {showNameError && (
                <p className="mt-2 text-sm text-red-500" role="alert">
                  {t('onboarding.welcome.nameErrorRequired')}
                </p>
              )}
            </label>

            <label className="block">
              <span className={`mb-1.5 block text-sm font-medium ${ui.textLabel}`}>
                {t('onboarding.welcome.age')}{' '}
                <span className="text-emerald-500">{t('common.required')}</span>
              </span>
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
              />
              {showAgeError && validation.ageErrorKey && (
                <p className="mt-2 text-sm text-red-500" role="alert">
                  {t(PROFILE_AGE_ERROR_KEYS[validation.ageErrorKey], {
                    min: PROFILE_MIN_AGE,
                    max: PROFILE_MAX_AGE,
                  })}
                </p>
              )}
            </label>
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

        <section className={ui.chartCard}>
          <h2 className={`text-base font-semibold ${ui.heading}`}>
            {t('account.cloud.title')}
          </h2>
          <CloudSyncBadge status={cloudSyncStatus} localOnly={!cloudEnabled} />
          <p className={`mt-3 text-sm ${ui.textMuted}`}>
            {cloudEnabled
              ? t('account.cloud.hintCloud')
              : t('account.cloud.hintLocal')}
          </p>
        </section>

        <FinancialParamsSection />

        {settings?.useRealReturn !== false && (
          <p
            className={`rounded-lg border px-3 py-2.5 text-sm ${ui.menuInnerBorder} text-amber-800 dark:text-amber-200/90`}
            role="status"
          >
            {t('account.financial.realReturnBanner')}
          </p>
        )}

        {saveMessage && (
          <p
            role="status"
            className={`text-sm ${
              saveMessage.type === 'success'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {t(saveMessage.key)}
          </p>
        )}

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

function CloudSyncBadge({ status, localOnly }) {
  const { t } = useTranslation();

  if (localOnly) {
    return (
      <span className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        {t('account.cloud.localOnly')}
      </span>
    );
  }

  const styles = {
    idle: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    syncing: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
    ready: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300',
  };

  const key = status in styles ? status : 'idle';

  return (
    <span
      className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-medium ${styles[key]}`}
    >
      {t(`account.cloud.status.${key}`)}
    </span>
  );
}
