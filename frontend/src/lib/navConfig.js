import { gridOutline, trendingUpOutline, walletOutline } from 'ionicons/icons';

/** Main app sections (dashboard, balance, projection). */
export const MAIN_NAV_ITEMS = [
  {
    to: '/dashboard',
    key: 'dashboard',
    icon: gridOutline,
    isActive: (pathname) =>
      pathname === '/dashboard' || pathname === '/',
  },
  {
    to: '/balance',
    key: 'balance',
    icon: walletOutline,
    isActive: (pathname) => pathname.startsWith('/balance'),
  },
  {
    to: '/projection',
    key: 'projection',
    icon: trendingUpOutline,
    isActive: (pathname) => pathname.startsWith('/projection'),
  },
];
