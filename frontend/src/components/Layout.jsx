import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { isNativeApp } from '../lib/platform';
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

  const useBottomNav = isNativeApp() || narrowViewport;

  useEffect(() => {
    document.title = t('app.name');
    document.documentElement.lang = i18n.language;
  }, [t, i18n.language]);

  const shellClass = useBottomNav
    ? `mx-auto flex min-h-screen max-w-6xl flex-col px-4 pt-4 sm:px-6 ${ui.page} pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))]`
    : `mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-6 pt-5 sm:px-6 ${ui.page}`;

  return (
    <div className={`financia-ui min-w-0 overflow-x-hidden ${shellClass}`}>
      {onboardingCompleted ? (
        <AppHeader compact={useBottomNav} />
      ) : (
        <header className="mb-8 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 pt-0.5">
            <p className={`text-xs font-medium uppercase tracking-widest ${ui.accent}`}>
              {t('app.tagline')}
            </p>
            <h1 className={`truncate text-2xl font-bold ${ui.heading}`}>
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
