import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { useAuthModal } from '../../context/AuthModalContext';
import { LOCALE_LABELS, SUPPORTED_LOCALES } from '../../i18n/config';
import { isAuthAvailable, signOutFromSupabase } from '../../lib/auth';
import { APP_VERSION, BrandCredit } from '../../components/AppFooter';
import { SelectField } from '../../components/SelectField';
import { ui } from '../../lib/uiClasses';
import { getDisplayName, getInitials } from '../../lib/userDisplay';
import { usePreferences, useProfile, useSessionMeta } from '../../store/hooks';

const THEME_KEYS = ['system', 'light', 'dark'];

export function ProfilePage() {
  const { t } = useTranslation();
  const { locale, theme, setLocale, setTheme } = usePreferences();
  const { profile } = useProfile();
  const { user, sessionStatus, cloudSyncStatus, logout } = useSessionMeta();
  const { openRegister, openLogin } = useAuthModal();
  const navigate = useNavigate();

  const isAuthenticated = sessionStatus === 'authenticated' && user != null;
  const displayName = getDisplayName({ profile, user, fallback: t('dashboard.profileFallback') });
  const initials = getInitials(displayName);

  const handleLogout = async () => {
    if (isAuthAvailable()) {
      await signOutFromSupabase();
    } else {
      logout();
    }
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className={ui.stackPage}>
      <section className={ui.chartCard}>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-bold ${ui.profileAvatar}`}
                aria-hidden
              >
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-base font-semibold ${ui.heading}`}>{displayName}</p>
                {user.email && (
                  <p className={`truncate text-sm ${ui.textMuted}`}>{user.email}</p>
                )}
                {cloudSyncStatus !== 'idle' && (
                  <p
                    className={`mt-1 text-xs ${
                      cloudSyncStatus === 'error'
                        ? 'text-[var(--color-negative)]'
                        : ui.textMuted
                    }`}
                  >
                    {cloudSyncStatus === 'syncing'
                      ? t('menu.cloudSyncing')
                      : cloudSyncStatus === 'error'
                        ? t('menu.cloudSyncError')
                        : t('menu.cloudSynced')}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <span
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${ui.profileAvatar}`}
                aria-hidden
              >
                <User size={24} />
              </span>
              <div className="min-w-0">
                <p className={`text-base font-semibold ${ui.heading}`}>{t('menu.guestTitle')}</p>
                <p className={`mt-0.5 text-sm ${ui.textMuted}`}>{t('menu.guestHint')}</p>
              </div>
            </>
          )}
        </div>
      </section>

      {isAuthenticated ? (
        <section className={`${ui.chartCard} space-y-2`}>
          <h2 className={`mb-3 text-xs font-semibold uppercase tracking-wide ${ui.textMuted}`}>
            {t('menu.account')}
          </h2>
          <button
            type="button"
            className={`${ui.btnSecondary} w-full justify-start`}
            onClick={() => navigate('/cuenta')}
          >
            {t('menu.accountSettings')}
          </button>
          <div className="flex items-center gap-2 rounded-[14px] px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${ui.heading}`}>
                {t('app.name')}
                {APP_VERSION ? (
                  <span className={`ml-2 text-xs font-normal ${ui.textMuted}`}>v{APP_VERSION}</span>
                ) : null}
              </p>
              <BrandCredit />
            </div>
          </div>
          <button
            type="button"
            className="inline-flex w-full cursor-pointer items-center justify-start gap-2 rounded-[14px] px-5 py-3 text-sm font-medium text-[var(--color-negative)] transition hover:bg-[rgba(226,75,74,0.08)]"
            onClick={handleLogout}
          >
            {t('menu.logout')}
          </button>
        </section>
      ) : (
        <section className={`${ui.chartCard} space-y-2`}>
          <h2 className={`mb-3 text-xs font-semibold uppercase tracking-wide ${ui.textMuted}`}>
            {t('menu.session')}
          </h2>
          <button type="button" className={`${ui.btnPrimary} w-full`} onClick={openRegister}>
            {t('menu.register')}
          </button>
          <button type="button" className={`${ui.btnSecondary} w-full`} onClick={openLogin}>
            {t('menu.login')}
          </button>
          <div className="flex items-center gap-2 rounded-[14px] px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${ui.heading}`}>
                {t('app.name')}
                {APP_VERSION ? (
                  <span className={`ml-2 text-xs font-normal ${ui.textMuted}`}>v{APP_VERSION}</span>
                ) : null}
              </p>
              <BrandCredit />
            </div>
          </div>
        </section>
      )}

      <section className={ui.chartCard}>
        <h2 className={`mb-4 text-xs font-semibold uppercase tracking-wide ${ui.textMuted}`}>
          {t('menu.preferences')}
        </h2>
        <div className="space-y-5">
          <div>
            <label
              htmlFor="profile-locale"
              className={`mb-2 block text-sm font-medium ${ui.textLabel}`}
            >
              {t('menu.language')}
            </label>
            <SelectField
              id="profile-locale"
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
            >
              {SUPPORTED_LOCALES.map((code) => (
                <option key={code} value={code}>
                  {LOCALE_LABELS[code]}
                </option>
              ))}
            </SelectField>
          </div>

          <div>
            <p className={`mb-2 text-sm font-medium ${ui.textLabel}`}>{t('menu.theme')}</p>
            <div
              className="grid grid-cols-3 gap-1.5 rounded-lg [border:0.5px_solid_rgba(255,255,255,0.08)] bg-[var(--bg-tertiary)] p-1"
              role="group"
              aria-label={t('menu.theme')}
            >
              {THEME_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={theme === key}
                  onClick={() => setTheme(key)}
                  className={`rounded-md px-2 py-2.5 text-sm font-medium transition ${
                    theme === key
                      ? 'bg-[var(--accent)] text-white shadow-sm'
                      : 'bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  {t(`menu.theme${key.charAt(0).toUpperCase() + key.slice(1)}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
