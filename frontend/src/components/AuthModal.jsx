import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useAuthModal } from '../context/AuthModalContext';
import { isAuthAvailable, signInWithEmail, signUpWithEmail } from '../lib/auth';
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
  const [infoKey, setInfoKey] = useState(null);

  const isSignup = mode === 'signup';
  const authReady = isAuthAvailable();

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !submitting) closeAuthModal();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, submitting, closeAuthModal]);

  useEffect(() => {
    if (!open) {
      setEmail('');
      setPassword('');
      setErrorKey(null);
      setInfoKey(null);
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorKey(null);
    setInfoKey(null);

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
        setErrorKey(
          result.errorCode === 'not_configured'
            ? 'auth.errors.notConfigured'
            : 'auth.errors.generic',
        );
        return;
      }

      if (result.needsEmailConfirmation) {
        setInfoKey('auth.confirmEmail');
        return;
      }

      setUser(result.user);

      if (result.migration?.success === false && !result.migration?.skipped) {
        setInfoKey('auth.migrationFailed');
      } else {
        setInfoKey('auth.success');
      }

      window.setTimeout(() => closeAuthModal(), 1200);
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[210] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/75"
        aria-label={t('auth.close')}
        onClick={() => !submitting && closeAuthModal()}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative z-[211] w-full max-w-md rounded-2xl border p-6 shadow-2xl ${ui.card}`}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className={`text-lg font-bold ${ui.heading}`}>
              {t(isSignup ? 'auth.registerTitle' : 'auth.loginTitle')}
            </h2>
            <p className={`mt-1 text-sm ${ui.textMuted}`}>
              {t(isSignup ? 'auth.registerSubtitle' : 'auth.loginSubtitle')}
            </p>
          </div>
          <button
            type="button"
            className={ui.iconBtn}
            aria-label={t('auth.close')}
            disabled={submitting}
            onClick={closeAuthModal}
          >
            ×
          </button>
        </div>

        {!authReady && (
          <p className={`mb-4 rounded-lg border px-3 py-2 text-sm ${ui.cardInset} ${ui.text}`}>
            {t('auth.notConfigured')}
          </p>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="auth-email" className={`mb-2 block text-sm font-medium ${ui.textLabel}`}>
              {t('auth.email')}
            </label>
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
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className={`mb-2 block text-sm font-medium ${ui.textLabel}`}
            >
              {t('auth.password')}
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={ui.input}
              disabled={submitting}
              minLength={6}
              required
            />
          </div>

          {errorKey && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {t(errorKey)}
            </p>
          )}

          {infoKey && (
            <p className="text-sm text-emerald-700 dark:text-emerald-300" role="status">
              {t(infoKey)}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !authReady}
            className={`w-full ${ui.btnPrimary}`}
          >
            {t(
              submitting
                ? 'auth.submitting'
                : isSignup
                  ? 'auth.registerSubmit'
                  : 'auth.loginSubmit',
            )}
          </button>
        </form>

        <p className={`mt-4 text-center text-sm ${ui.textMuted}`}>
          {isSignup ? t('auth.hasAccount') : t('auth.noAccount')}{' '}
          <button
            type="button"
            className={`font-medium ${ui.accent} hover:underline`}
            disabled={submitting}
            onClick={() => {
              setErrorKey(null);
              setInfoKey(null);
              setMode(isSignup ? 'login' : 'signup');
            }}
          >
            {t(isSignup ? 'auth.switchToLogin' : 'auth.switchToRegister')}
          </button>
        </p>
      </div>
    </div>,
    document.body,
  );
}
