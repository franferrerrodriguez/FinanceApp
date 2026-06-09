import { LayoutGrid, TrendingUp, Wallet } from 'lucide-react';

/** Main app sections (dashboard, balance, projection). */
export const MAIN_NAV_ITEMS = [
  {
    to: '/dashboard',
    key: 'dashboard',
    icon: LayoutGrid,
    isActive: (pathname) =>
      pathname === '/dashboard' || pathname === '/',
  },
  {
    to: '/balance',
    key: 'balance',
    icon: Wallet,
    isActive: (pathname) => pathname.startsWith('/balance'),
  },
  {
    to: '/projection',
    key: 'projection',
    icon: TrendingUp,
    isActive: (pathname) => pathname.startsWith('/projection'),
  },
];
