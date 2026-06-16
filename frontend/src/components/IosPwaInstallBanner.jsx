import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isIosSafari, isStandalonePwa } from '../lib/platform';

const DISMISSED_KEY = 'pwa_install_banner_dismissed';

function isDismissed() {
  return !!localStorage.getItem(DISMISSED_KEY);
}

function dismiss() {
  localStorage.setItem(DISMISSED_KEY, '1');
}

// iOS share icon — box with arrow pointing up
function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline-block h-[1.1em] w-[1.1em] align-[-0.15em]"
      aria-hidden
    >
      <path d="M8.5 5.5 12 2l3.5 3.5" />
      <line x1="12" y1="2" x2="12" y2="14" />
      <path d="M7 8H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-2" />
    </svg>
  );
}

function CloseButton({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="mt-0.5 shrink-0 rounded-full p-1 text-[rgba(197,208,220,0.50)] transition hover:text-white"
    >
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="h-4 w-4" aria-hidden>
        <line x1="3" y1="3" x2="13" y2="13" />
        <line x1="13" y1="3" x2="3" y2="13" />
      </svg>
    </button>
  );
}

function BannerShell({ children, onDismiss, dismissLabel }) {
  return (
    <div
      role="banner"
      className="fixed bottom-0 left-0 right-0 z-[300] px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-0"
    >
      <div className="mx-auto max-w-lg rounded-2xl [border:0.5px_solid_rgba(255,255,255,0.12)] bg-[#1E2530] px-5 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-3">
          {children}
          <CloseButton onClick={onDismiss} label={dismissLabel} />
        </div>
        <div className="mt-3 flex justify-center">
          <div className="h-1.5 w-1.5 rotate-45 border-b border-r border-[rgba(255,255,255,0.12)] bg-[#1E2530]" />
        </div>
      </div>
    </div>
  );
}

export function IosPwaInstallBanner() {
  const { t } = useTranslation();

  // iOS Safari — show instructions
  const [iosVisible, setIosVisible] = useState(
    () => isIosSafari() && !isStandalonePwa() && !isDismissed(),
  );

  // Chrome/Android/Edge — capture the native install prompt
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    if (isStandalonePwa() || isDismissed()) return;

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    const onInstalled = () => {
      dismiss();
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleChromeDismiss = () => {
    dismiss();
    setDeferredPrompt(null);
  };

  const handleChromeInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') dismiss();
    setDeferredPrompt(null);
  };

  // Chrome/Android/Edge banner
  if (deferredPrompt) {
    return (
      <BannerShell onDismiss={handleChromeDismiss} dismissLabel={t('common.close')}>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">
            {t('pwa.installTitle')}
          </p>
          <p className="mt-1 text-[0.8125rem] leading-snug text-[rgba(197,208,220,0.75)]">
            {t('pwa.installSubtitle')}
          </p>
          <button
            type="button"
            onClick={handleChromeInstall}
            className="mt-3 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent)]/80"
          >
            {t('pwa.installButton')}
          </button>
        </div>
      </BannerShell>
    );
  }

  // iOS Safari banner
  if (!iosVisible) return null;

  return (
    <BannerShell
      onDismiss={() => { dismiss(); setIosVisible(false); }}
      dismissLabel={t('common.close')}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">
          {t('pwa.installTitle')}
        </p>
        <p className="mt-1 text-[0.8125rem] leading-snug text-[rgba(197,208,220,0.75)]">
          {t('pwa.installStep1')} <ShareIcon /> {t('pwa.installStep2')}
        </p>
      </div>
    </BannerShell>
  );
}
