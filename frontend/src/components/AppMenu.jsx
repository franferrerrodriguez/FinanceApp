import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, User, X } from 'lucide-react';
import { useAuthModal } from '../context/AuthModalContext';
import { LOCALE_LABELS, SUPPORTED_LOCALES } from '../i18n/config';
import { isAuthAvailable, signOutFromSupabase } from '../lib/auth';
import { SelectField } from './SelectField';
import { ui } from '../lib/uiClasses';
import { getDisplayName, getInitials } from '../lib/userDisplay';
import { usePreferences, useProfile, useSessionMeta } from '../store/hooks';

export function AppMenu({ className = '' }) {
  const { t } = useTranslation();
  const { locale, theme, setLocale, setTheme } = usePreferences();
  const { profile } = useProfile();
  const { user, sessionStatus, cloudSyncStatus, logout } = useSessionMeta();
  const { openRegister, openLogin } = useAuthModal();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const panelRef = useRef(null);

  const isAuthenticated = sessionStatus === 'authenticated' && user != null;
  const displayName = getDisplayName({
    profile,
    user,
    fallback: t('dashboard.profileFallback'),
  });
  const initials = getInitials(displayName);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const close = () => setOpen(false);

  const handleLogout = async () => {
    if (isAuthAvailable()) {
      await signOutFromSupabase();
    } else {
      logout();
    }
    close();
  };

  const handleRegister = () => {
    close();
    openRegister();
  };

  const handleLogin = () => {
    close();
    openLogin();
  };

  const handleAccount = () => {
    close();
    navigate('/cuenta');
  };

  return (
    <>
      <div className={className}>
        <button
          type="button"
          className={`financia-profile-trigger inline-flex shrink-0 items-center justify-center rounded-full transition ${
            open
              ? '[border:0.5px_solid_rgba(29,158,117,0.6)] bg-[rgba(29,158,117,0.10)] ring-2 ring-[rgba(29,158,117,0.25)]'
              : `${ui.profileChip} hover:[border-color:rgba(255,255,255,0.18)]`
          } h-11 w-11 p-0.5 sm:h-auto sm:w-auto sm:gap-0.5 sm:px-1.5 sm:py-1`}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-controls={open ? menuId : undefined}
          aria-label={t('menu.openProfile')}
          onClick={() => setOpen((value) => !value)}
        >
          <span
            className={`financia-profile-avatar flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${ui.profileAvatar}`}
            aria-hidden
          >
            {isAuthenticated ? initials : <User size={18} />}
          </span>
          <span className="hidden shrink-0 sm:inline-flex">
            <ChevronDown
              size={16}
              className={`text-[var(--text-muted)] transition ${open ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </span>
        </button>
      </div>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[200]">
            <button
              type="button"
              className={ui.menuBackdrop}
              aria-label={t('menu.close')}
              onClick={close}
            />

            <div
              ref={panelRef}
              id={menuId}
              role="dialog"
              aria-modal="true"
              aria-label={t('menu.title')}
              className={ui.menuPanel}
            >
              <div className="relative [border-bottom:0.5px_solid_rgba(255,255,255,0.08)] px-4 py-4">
                {isAuthenticated ? (
                  <div className="flex items-center gap-3 pr-8">
                    <span
                      className={`financia-profile-avatar flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold ${ui.profileAvatar}`}
                      aria-hidden
                    >
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className={`truncate text-base font-semibold ${ui.heading}`}>
                        {displayName}
                      </p>
                      {user.email ? (
                        <p className={`truncate text-sm ${ui.textMuted}`}>{user.email}</p>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 pr-8">
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${ui.profileAvatar}`}
                      aria-hidden
                    >
                      <User size={22} />
                    </span>
                    <div className="min-w-0">
                      <p className={`text-base font-semibold ${ui.heading}`}>
                        {t('menu.guestTitle')}
                      </p>
                      <p className={`text-sm ${ui.textMuted}`}>{t('menu.guestHint')}</p>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={close}
                  className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]"
                  aria-label={t('menu.close')}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[min(70vh,calc(100dvh-6rem))] overflow-y-auto p-2">
                {isAuthenticated && cloudSyncStatus !== 'idle' && (
                  <p
                    className={`mx-3 mb-2 text-xs ${
                      cloudSyncStatus === 'error'
                        ? 'text-[var(--color-negative)]'
                        : ui.textMuted
                    }`}
                    role="status"
                    aria-live="polite"
                  >
                    {cloudSyncStatus === 'syncing'
                      ? t('menu.cloudSyncing')
                      : cloudSyncStatus === 'error'
                        ? t('menu.cloudSyncError')
                        : t('menu.cloudSynced')}
                  </p>
                )}

                {isAuthenticated && (
                  <MenuSection title={t('menu.account')} first>
                    <MenuButton onClick={handleAccount}>
                      {t('menu.accountSettings')}
                    </MenuButton>
                    <MenuButton onClick={handleLogout} variant="danger">
                      {t('menu.logout')}
                    </MenuButton>
                  </MenuSection>
                )}

                {!isAuthenticated && (
                  <MenuSection title={t('menu.session')} first>
                    <MenuButton onClick={handleRegister} variant="primary">
                      {t('menu.register')}
                    </MenuButton>
                    <MenuButton onClick={handleLogin}>
                      {t('menu.login')}
                    </MenuButton>
                  </MenuSection>
                )}

                <MenuSection title={t('menu.preferences')} first={!isAuthenticated}>
                  <MenuRow label={t('menu.language')}>
                    <SelectField
                      id="app-menu-locale"
                      variant="menu"
                      value={locale}
                      onChange={(e) => setLocale(e.target.value)}
                    >
                      {SUPPORTED_LOCALES.map((code) => (
                        <option key={code} value={code}>
                          {LOCALE_LABELS[code]}
                        </option>
                      ))}
                    </SelectField>
                  </MenuRow>

                  <MenuRow label={t('menu.theme')}>
                    <div
                      className="grid grid-cols-3 gap-1.5 rounded-lg [border:0.5px_solid_rgba(255,255,255,0.08)] bg-[var(--bg-tertiary)] p-1"
                      role="group"
                      aria-label={t('menu.theme')}
                    >
                      <ThemeOption
                        active={theme === 'system'}
                        label={t('menu.themeSystem')}
                        onClick={() => setTheme('system')}
                      />
                      <ThemeOption
                        active={theme === 'light'}
                        label={t('menu.themeLight')}
                        onClick={() => setTheme('light')}
                      />
                      <ThemeOption
                        active={theme === 'dark'}
                        label={t('menu.themeDark')}
                        onClick={() => setTheme('dark')}
                      />
                    </div>
                  </MenuRow>
                </MenuSection>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function MenuSection({ title, children, first = false }) {
  return (
    <div className={`py-2 ${first ? '' : '[border-top:0.5px_solid_rgba(255,255,255,0.08)]'}`}>
      <p
        className={`px-3 pb-2 text-xs font-semibold uppercase tracking-wide ${ui.textMuted}`}
      >
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function MenuRow({ label, children }) {
  return (
    <div className="px-3 py-2">
      <label className={`mb-2 block text-sm font-medium ${ui.textLabel}`}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ThemeOption({ active, label, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-md px-2 py-2.5 text-xs font-medium transition sm:text-sm ${
        active
          ? 'bg-[var(--accent)] text-white shadow-sm'
          : 'bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
      }`}
    >
      {label}
    </button>
  );
}

function MenuButton({ children, onClick, disabled, hint, variant = 'default' }) {
  const variantClass =
    variant === 'danger'
      ? 'text-[var(--color-negative)] hover:bg-[rgba(226,75,74,0.10)]'
      : variant === 'primary'
        ? 'font-semibold text-[var(--accent)] hover:bg-[var(--accent-muted)]'
        : `${ui.textLabel} hover:bg-[var(--bg-hover)]`;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`mx-1 flex w-[calc(100%-0.5rem)] flex-col items-start rounded-lg px-3 py-2.5 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClass}`}
    >
      <span>{children}</span>
      {disabled && hint && (
        <span className={`mt-0.5 text-xs ${ui.textMuted}`}>{hint}</span>
      )}
    </button>
  );
}
