import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useAuthModal } from '../context/AuthModalContext';
import { isAuthAvailable, signInWithEmail, signUpWithEmail } from '../lib/auth';
import { isSimpleAuthMode } from '../lib/authConfig';
import { PasswordField } from './PasswordField';
import { ui } from '../lib/uiClasses';
import { useSessionMeta } from '../store/hooks';

export function AuthModal() {
  const { t } = useTranslation();
  const { open, mode, setMode, closeAuthModal } = useAuthModal();
  const { setUser } = useSessionMeta();
  const titleId = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState(null);
  const [phase, setPhase] = useState('form');
  const [pendingEmail, setPendingEmail] = useState('');

  const isSignup = mode === 'signup';
  const authReady = isAuthAvailable();
  const simpleAuth = isSimpleAuthMode();

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !submitting) closeAuthModal();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, submitting, closeAuthModal]);

  useEffect(() => {
    if (!open) {
      setEmail('');
      setPassword('');
      setErrorKey(null);
      setPhase('form');
      setPendingEmail('');
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const goToLogin = () => {
    setPhase('form');
    setErrorKey(null);
    setPassword('');
    setMode('login');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorKey(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorKey('auth.errors.required');
      return;
    }
    if (!authReady) {
      setErrorKey('auth.errors.notConfigured');
      return;
    }

    setSubmitting(true);
    try {
      const result = isSignup
        ? await signUpWithEmail({ email: trimmedEmail, password })
        : await signInWithEmail({ email: trimmedEmail, password });

      if (!result.ok) {
        const key =
          result.errorCode === 'not_configured'
            ? 'notConfigured'
            : result.errorCode ?? 'generic';
        setErrorKey(`auth.errors.${key}`);
        return;
      }

      if (result.needsEmailConfirmation) {
        setPendingEmail(result.email ?? trimmedEmail);
        setPhase('confirm_email');
        return;
      }

      setUser(result.user);
      if (result.sync?.success === false && !result.sync?.skipped) {
        setPhase('migration_failed');
      } else {
        setPhase('success');
        window.setTimeout(() => closeAuthModal(), 1600);
      }
    } finally {
      setSubmitting(false);
    }
  };

  let headerTitle = t(isSignup ? 'auth.registerTitle' : 'auth.loginTitle');
  let headerSubtitle = simpleAuth
    ? t('auth.simpleModeNotice')
    : t(isSignup ? 'auth.registerSubtitle' : 'auth.loginSubtitle');

  if (phase === 'confirm_email') {
    headerTitle = t('auth.confirmEmailTitle');
    headerSubtitle = t('auth.confirmEmailSubtitle');
  } else if (phase === 'success') {
    headerTitle = t('auth.successTitle');
    headerSubtitle = t('auth.successSubtitle');
  } else if (phase === 'migration_failed') {
    headerTitle = t('auth.migrationFailedTitle');
    headerSubtitle = '';
  }

  return createPortal(
    <div className="fixed inset-0 z-[210] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className={ui.modalBackdrop}
        aria-label={t('auth.close')}
        onClick={() => !submitting && closeAuthModal()}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={ui.modalPanel}
      >
        <AuthModalHeader
          titleId={titleId}
          title={headerTitle}
          subtitle={headerSubtitle}
          onClose={closeAuthModal}
          disabled={submitting}
          icon={
            phase === 'confirm_email' ? (
              <MailIcon />
            ) : phase === 'success' ? (
              <CheckIcon />
            ) : phase === 'migration_failed' ? (
              <AlertIcon />
            ) : (
              <UserIcon />
            )
          }
        />

        <div className={ui.modalBody}>
          {phase === 'confirm_email' && (
            <div className="text-center" role="status" aria-live="polite">
              <div className={ui.authIconWrap}>
                <MailIcon large />
              </div>
              <p className={`mt-5 text-sm leading-relaxed ${ui.text}`}>
                {t('auth.confirmEmailBody')}
              </p>
              <p className={ui.authEmailChip}>{pendingEmail}</p>
              <ol className={`mt-5 space-y-2 text-left text-sm ${ui.text}`}>
                <li className="flex gap-3">
                  <StepBadge n={1} done />
                  <span>{t('auth.confirmStep1')}</span>
                </li>
                <li className="flex gap-3">
                  <StepBadge n={2} />
                  <span>{t('auth.confirmStep2')}</span>
                </li>
                <li className="flex gap-3">
                  <StepBadge n={3} />
                  <span>{t('auth.confirmStep3')}</span>
                </li>
              </ol>
            </div>
          )}

          {phase === 'success' && (
            <div className="text-center" role="status" aria-live="polite">
              <div className={ui.authIconWrap}>
                <CheckIcon large />
              </div>
              <p className={`mt-4 text-sm ${ui.text}`}>{t('auth.success')}</p>
            </div>
          )}

          {phase === 'migration_failed' && (
            <div className="text-center" role="status">
              <div className={ui.authIconWrap}>
                <AlertIcon large />
              </div>
              <p className={`mt-4 text-sm leading-relaxed ${ui.text}`}>
                {t('auth.migrationFailed')}
              </p>
            </div>
          )}

          {phase === 'form' && (
            <>
              <div className={ui.authTabTrack} role="tablist" aria-label={t('auth.modeTabs')}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isSignup}
                  className={isSignup ? ui.authTabActive : ui.authTab}
                  onClick={() => {
                    setErrorKey(null);
                    setMode('signup');
                  }}
                >
                  {t('menu.register')}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={!isSignup}
                  className={!isSignup ? ui.authTabActive : ui.authTab}
                  onClick={() => {
                    setErrorKey(null);
                    setMode('login');
                  }}
                >
                  {t('menu.login')}
                </button>
              </div>

              {!authReady && (
                <p className={`mb-4 rounded-xl px-3 py-2.5 text-sm ${ui.cardInset} ${ui.text}`}>
                  {t('auth.notConfigured')}
                </p>
              )}

              <form className="space-y-4" onSubmit={handleSubmit} id="auth-form">
                <Field label={t('auth.email')} id="auth-email">
                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={ui.input}
                    disabled={submitting}
                    required
                  />
                </Field>
                <PasswordField
                  id="auth-password"
                  label={t('auth.password')}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  minLength={6}
                  required
                />
                {errorKey && (
                  <p
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
                    role="alert"
                  >
                    {t(errorKey)}
                  </p>
                )}
              </form>
            </>
          )}
        </div>

        <div className={ui.modalFooter}>
          {phase === 'confirm_email' && (
            <>
              <button type="button" className={ui.btnPrimary} onClick={goToLogin}>
                {t('auth.confirmEmailLogin')}
              </button>
              <button type="button" className={ui.btnGhost} onClick={closeAuthModal}>
                {t('auth.later')}
              </button>
            </>
          )}

          {phase === 'form' && (
            <button
              type="submit"
              form="auth-form"
              disabled={submitting || !authReady}
              className={ui.btnPrimary}
            >
              {t(
                submitting
                  ? 'auth.submitting'
                  : isSignup
                    ? 'auth.registerSubmit'
                    : 'auth.loginSubmit',
              )}
            </button>
          )}

          {(phase === 'success' || phase === 'migration_failed') && (
            <button type="button" className={ui.btnPrimary} onClick={closeAuthModal}>
              {t('auth.close')}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function AuthModalHeader({ titleId, title, subtitle, onClose, disabled, icon }) {
  const { t } = useTranslation();

  return (
    <div className="relative border-b border-slate-100 px-6 py-5 dark:border-slate-800">
      <button
        type="button"
        className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        aria-label={t('auth.close')}
        disabled={disabled}
        onClick={onClose}
      >
        <CloseIcon />
      </button>
      <div className="flex items-start gap-3 pr-8">
        <div className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400">{icon}</div>
        <div className="min-w-0">
          <h2 id={titleId} className={`text-lg font-semibold tracking-tight ${ui.heading}`}>
            {title}
          </h2>
          {subtitle ? (
            <p className={`mt-1 text-sm leading-snug ${ui.textMuted}`}>{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Field({ label, id, children }) {
  return (
    <div>
      <label htmlFor={id} className={`mb-1.5 block text-sm font-medium ${ui.textLabel}`}>
        {label}
      </label>
      {children}
    </div>
  );
}

function StepBadge({ n, done = false }) {
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        done
          ? 'bg-emerald-500 text-slate-950'
          : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
      }`}
    >
      {done ? '✓' : n}
    </span>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 20c0-4 3.5-6 7-6s7 2 7 6" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon({ large = false }) {
  const size = large ? 28 : 22;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ large = false }) {
  const size = large ? 28 : 22;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 12l5 5L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertIcon({ large = false }) {
  const size = large ? 28 : 22;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
      <path d="M10.3 4.3h3.4L20 19H4L10.3 4.3z" strokeLinejoin="round" />
    </svg>
  );
}
