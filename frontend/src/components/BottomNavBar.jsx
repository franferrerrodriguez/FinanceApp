import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';
import { MAIN_NAV_ITEMS } from '../lib/navConfig';

export function BottomNavBar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <nav className="financia-bottom-nav" aria-label={t('nav.main')}>
      {MAIN_NAV_ITEMS.map(({ to, key, icon: Icon, isActive }) => {
        const active = isActive(pathname);
        return (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={`financia-bottom-nav__item ${active ? 'financia-bottom-nav__item--active' : ''}`}
          >
            <Icon className="financia-bottom-nav__icon" aria-hidden strokeWidth={1.75} />
            <span className="financia-bottom-nav__label">{t(`nav.${key}`)}</span>
            {active && (
              <span className="financia-bottom-nav__indicator" aria-hidden />
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
