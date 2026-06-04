import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { ui } from '../lib/uiClasses';
import { useOnboardingState } from '../store/hooks';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import { AppMenu } from './AppMenu';

const appNavItems = [
  { to: '/dashboard', key: 'dashboard' },
  { to: '/balance', key: 'balance' },
  { to: '/proyeccion', key: 'projection' },
];

export function Layout() {
  const { t, i18n } = useTranslation();
  const { completed: onboardingCompleted } = useOnboardingState();

  useEffect(() => {
    document.title = t('app.name');
    document.documentElement.lang = i18n.language;
  }, [t, i18n.language]);

  return (
    <div
      className={`mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-6 pt-5 sm:px-6 ${ui.page}`}
    >
      {onboardingCompleted ? (
        <AppHeader navItems={appNavItems} />
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
      <main className="flex-1">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
}
