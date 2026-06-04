import { LOCALE_BCP47 } from '../i18n/config';
import i18n from '../i18n';

function getIntlLocale() {
  return LOCALE_BCP47[i18n.language] ?? LOCALE_BCP47.es;
}

/** Fecha de proyección en tabla (ej. 01/05/2026). */
export function formatProjectionDate(date) {
  return new Intl.DateTimeFormat(getIntlLocale(), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}
