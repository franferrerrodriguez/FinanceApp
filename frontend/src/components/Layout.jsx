import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router-dom';
import { isStandalonePwa } from '../lib/platform';
import { ui } from '../lib/uiClasses';
import { useOnboardingState } from '../store/hooks';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import { AppMenu } from './AppMenu';
import { BottomNavBar } from './BottomNavBar';

const MOBILE_NAV = '(max-width: 767px)';

export function Layout() {
  const { t, i18n } = useTranslation();
  const { completed: onboardingCompleted } = useOnboardingState();
  const location = useLocation();
  const isWelcomeOnboarding =
    !onboardingCompleted &&
    (location.pathname === '/onboarding' || location.pathname.endsWith('/onboarding'));
  const [narrowViewport, setNarrowViewport] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_NAV).matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_NAV);
    const onChange = () => setNarrowViewport(mq.matches);
    mq.addEventListener('change', onChange);
    setNarrowViewport(mq.matches);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const useBottomNav = narrowViewport || isStandalonePwa();

  useEffect(() => {
    document.title = t('app.name');
    document.documentElement.lang = i18n.language;
  }, [t, i18n.language]);

  // On the welcome onboarding screen the form card bleeds to screen edges:
  // override the shell bg to match the card and strip the bottom padding so
  // no dark strip is visible when scrolling to the bottom.
  const base = `financia-ui min-w-0 overflow-x-hidden mx-auto flex min-h-screen max-w-6xl flex-col px-4 sm:px-6 ${ui.page}`;
  let shellClass;
  if (isWelcomeOnboarding) {
    shellClass = `${base} pt-4 pb-0 bg-[var(--bg-secondary)]`;
  } else if (useBottomNav) {
    shellClass = `${base} pt-4 pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))]`;
  } else {
    shellClass = `${base} pt-5 pb-6`;
  }

  return (
    <div className={shellClass}>
      {onboardingCompleted ? (
        <AppHeader compact={useBottomNav} />
      ) : isWelcomeOnboarding ? (
        <header className="mb-2 flex items-center justify-between">
          <p className="text-lg font-bold tracking-tight text-[var(--accent)]">{t('app.name')}</p>
          <AppMenu className="shrink-0" />
        </header>
      ) : (
        <header className="mb-8 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 pt-0.5">
            <p className={`text-xs font-medium uppercase tracking-widest ${ui.accent}`}>
              {t('app.tagline')}
            </p>
            <h1 className={`truncate ${ui.pageTitle}`}>
              {t('app.name')}
            </h1>
          </div>
          <AppMenu className="shrink-0" />
        </header>
      )}

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>

      {!useBottomNav && <AppFooter />}

      {onboardingCompleted && useBottomNav && <BottomNavBar />}
    </div>
  );
}
