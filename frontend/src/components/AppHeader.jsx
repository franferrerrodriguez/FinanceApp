import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { ui } from '../lib/uiClasses';
import { useProfile } from '../store/hooks';
import { AppMenu } from './AppMenu';

function getInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function AppHeader({ navItems }) {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const displayName = profile?.name?.trim() || t('dashboard.profileFallback');

  return (
    <header className={`relative mb-8 border-b pb-5 ${ui.divider}`}>
      <div className="flex items-center justify-between gap-3">
        <NavLink to="/dashboard" className="group flex min-w-0 items-center gap-2.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(52,211,153,0.55)]"
            aria-hidden
          />
          <span
            className={`truncate text-lg font-bold tracking-tight transition group-hover:text-emerald-600 dark:group-hover:text-emerald-400 ${ui.heading}`}
          >
            {t('app.name')}
          </span>
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
          <div
            className={`hidden items-center gap-2.5 rounded-full border py-1 pl-1 pr-3 sm:flex ${ui.profileChip}`}
            title={displayName}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${ui.profileAvatar}`}
              aria-hidden
            >
              {getInitials(displayName)}
            </span>
            <span className={`max-w-[5.5rem] truncate text-sm font-medium ${ui.textLabel}`}>
              {displayName}
            </span>
          </div>
          <AppMenu className="shrink-0" />
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
