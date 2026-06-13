import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Check, Mail, User, X } from 'lucide-react';
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

  const phaseIcon =
    phase === 'confirm_email' ? (
      <Mail size={22} />
    ) : phase === 'success' ? (
      <Check size={22} />
    ) : phase === 'migration_failed' ? (
      <AlertTriangle size={22} />
    ) : (
      <User size={22} />
    );

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
        <div className="relative [border-bottom:0.5px_solid_rgba(255,255,255,0.08)] px-6 py-5">
          <button
            type="button"
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]"
            aria-label={t('auth.close')}
            disabled={submitting}
            onClick={closeAuthModal}
          >
            <X size={18} />
          </button>
          <div className="flex items-start gap-3 pr-8">
            <div className="mt-0.5 shrink-0 text-[var(--accent)]">{phaseIcon}</div>
            <div className="min-w-0">
              <h2 id={titleId} className={`text-lg font-semibold tracking-tight ${ui.heading}`}>
                {headerTitle}
              </h2>
              {headerSubtitle ? (
                <p className={`mt-1 text-sm leading-snug ${ui.textMuted}`}>{headerSubtitle}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className={ui.modalBody}>
          {phase === 'confirm_email' && (
            <div className="text-center" role="status" aria-live="polite">
              <div className={ui.authIconWrap}>
                <Mail size={28} />
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
                <Check size={28} />
              </div>
              <p className={`mt-4 text-sm ${ui.text}`}>{t('auth.success')}</p>
            </div>
          )}

          {phase === 'migration_failed' && (
            <div className="text-center" role="status">
              <div className={ui.authIconWrap}>
                <AlertTriangle size={28} />
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
                    className="rounded-xl [border:0.5px_solid_rgba(226,75,74,0.25)] bg-[rgba(226,75,74,0.10)] px-3 py-2 text-sm text-[var(--color-negative)]"
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

function Field({ label, id, children }) {
  return (
    <div>
      <label htmlFor={id} className={`${ui.formFieldLabel} ${ui.formFieldHintAfter}`}>
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
          ? 'bg-[var(--accent)] text-white'
          : 'bg-[rgba(255,255,255,0.10)] text-[var(--text-secondary)]'
      }`}
    >
      {done ? '✓' : n}
    </span>
  );
}
