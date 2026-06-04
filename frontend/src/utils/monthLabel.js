import i18n from '../i18n';
import { LOCALE_BCP47 } from '../i18n/config';

export function formatMonthKey(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) return monthKey;

  const date = new Date(year, month - 1, 1);
  const locale = LOCALE_BCP47[i18n.language] ?? LOCALE_BCP47.es;

  return date.toLocaleDateString(locale, { month: 'short', year: '2-digit' });
}
