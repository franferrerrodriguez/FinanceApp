import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router-dom';
import { MAIN_NAV_ITEMS } from '../lib/navConfig';
import { ui } from '../lib/uiClasses';
import { AppAlertsButton } from './AppAlertsButton';
import { AppMenu } from './AppMenu';

export function AppHeader({ compact = false, navItems = MAIN_NAV_ITEMS }) {
  const { t } = useTranslation();

  if (compact) {
    return (
      <header
        className={`mb-4 flex items-center justify-between gap-3 border-b pb-3 ${ui.divider}`}
      >
        <Link
          to="/dashboard"
          className={`group truncate text-base font-bold tracking-tight transition group-hover:text-emerald-600 dark:group-hover:text-emerald-400 ${ui.heading}`}
        >
          {t('app.name')}
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <AppAlertsButton />
          <AppMenu />
        </div>
      </header>
    );
  }

  return (
    <header className={`relative mb-8 border-b pb-5 ${ui.divider}`}>
      <div className="flex items-center justify-between gap-3">
        <NavLink
          to="/dashboard"
          className={`group truncate text-lg font-bold tracking-tight transition group-hover:text-emerald-600 dark:group-hover:text-emerald-400 ${ui.heading}`}
        >
          {t('app.name')}
        </NavLink>

        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex"
          aria-label={t('nav.main')}
        >
          {navItems.map(({ to, key }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive ? ui.navTabActive : ui.navTab
              }
            >
              {t(`nav.${key}`)}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <AppAlertsButton />
          <AppMenu />
        </div>
      </div>

      <nav
        className="mt-4 flex flex-wrap gap-2 md:hidden"
        aria-label={t('nav.main')}
      >
        {navItems.map(({ to, key }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive ? ui.navTabActive : ui.navTab
            }
          >
            {t(`nav.${key}`)}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
