import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useAuthModal } from '../context/AuthModalContext';
import { LOCALE_LABELS, SUPPORTED_LOCALES } from '../i18n/config';
import { isAuthAvailable, signOutFromSupabase } from '../lib/auth';
import { ui } from '../lib/uiClasses';
import { usePreferences, useSessionMeta } from '../store/hooks';

export function AppMenu({ className = '' }) {
  const { t } = useTranslation();
  const { locale, theme, setLocale, setTheme } = usePreferences();
  const { user, sessionStatus, logout } = useSessionMeta();
  const { openRegister, openLogin } = useAuthModal();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  const isAuthenticated = sessionStatus === 'authenticated' && user != null;

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
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

  return (
    <>
      <div className={className}>
        <button
          ref={buttonRef}
          type="button"
          className={`inline-flex h-11 w-11 items-center justify-center ${
            open ? ui.menuTriggerActive : ui.menuTrigger
          }`}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-controls={open ? menuId : undefined}
          aria-label={t('menu.open')}
          onClick={() => setOpen((value) => !value)}
        >
          <MenuIcon open={open} />
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
              <div className={`flex items-center justify-between border-b px-4 py-3 ${ui.divider}`}>
                <p className={`text-sm font-semibold ${ui.heading}`}>
                  {t('menu.title')}
                </p>
                <button
                  type="button"
                  onClick={close}
                  className={`inline-flex h-9 w-9 items-center justify-center ${ui.menuTrigger}`}
                  aria-label={t('menu.close')}
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="max-h-[min(70vh,calc(100dvh-6rem))] overflow-y-auto p-2">
                <MenuSection title={t('menu.preferences')} first>
                  <MenuRow label={t('menu.language')}>
                    <select
                      id="app-menu-locale"
                      value={locale}
                      onChange={(e) => setLocale(e.target.value)}
                      className={`w-full ${ui.select}`}
                    >
                      {SUPPORTED_LOCALES.map((code) => (
                        <option key={code} value={code}>
                          {LOCALE_LABELS[code]}
                        </option>
                      ))}
                    </select>
                  </MenuRow>

                  <MenuRow label={t('menu.theme')}>
                    <div
                      className={`grid grid-cols-3 gap-1.5 rounded-lg border p-1 ${ui.menuInnerBorder}`}
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

                {isAuthenticated ? (
                  <MenuSection title={t('menu.account')}>
                    <p className={`px-3 py-2 text-sm ${ui.text}`} role="presentation">
                      {user.email ?? user.id}
                    </p>
                    <MenuButton
                      onClick={close}
                      disabled
                      hint={t('common.nextIteration')}
                    >
                      {t('menu.accountSettings')}
                    </MenuButton>
                    <MenuButton onClick={handleLogout} variant="danger">
                      {t('menu.logout')}
                    </MenuButton>
                  </MenuSection>
                ) : (
                  <MenuSection title={t('menu.session')}>
                    <p className={`px-3 py-2 text-xs leading-relaxed ${ui.textMuted}`}>
                      {t('menu.guestHint')}
                    </p>
                    <MenuButton onClick={handleRegister} variant="primary">
                      {t('menu.register')}
                    </MenuButton>
                    <MenuButton onClick={handleLogin}>
                      {t('menu.login')}
                    </MenuButton>
                  </MenuSection>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function MenuIcon({ open }) {
  if (open) {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    );
  }

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function MenuSection({ title, children, first = false }) {
  return (
    <div className={`py-2 ${first ? '' : `border-t ${ui.divider}`}`}>
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
          ? 'bg-emerald-500 text-slate-950 shadow-sm'
          : `bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700`
      }`}
    >
      {label}
    </button>
  );
}

function MenuButton({ children, onClick, disabled, hint, variant = 'default' }) {
  const variantClass =
    variant === 'danger'
      ? 'text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/50'
      : variant === 'primary'
        ? 'font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40'
        : `${ui.textLabel} hover:bg-slate-100 dark:hover:bg-slate-800`;

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
