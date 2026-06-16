import { LayoutGrid, TrendingUp, User, Wallet } from 'lucide-react';

/** Main app sections shown in both desktop nav and bottom nav bar. */
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
  {
    to: '/profile',
    key: 'profile',
    icon: User,
    isActive: (pathname) => pathname.startsWith('/profile'),
    bottomNavOnly: true,
  },
];
