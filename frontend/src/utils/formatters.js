import i18n from '../i18n';
import { LOCALE_BCP47 } from '../i18n/config';

function getIntlLocale() {
  return LOCALE_BCP47[i18n.language] ?? LOCALE_BCP47.es;
}

/** Formato estándar para importes en EUR (siempre 2 decimales). */
function moneyFormatter() {
  return new Intl.NumberFormat(getIntlLocale(), {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Ejes de gráficos y cifras muy grandes sin decimales. */
function moneyCompactFormatter() {
  return new Intl.NumberFormat(getIntlLocale(), {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  });
}

function percentFormatter() {
  return new Intl.NumberFormat(getIntlLocale(), {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/** Importes monetarios en UI (onboarding, dashboard, tablas). */
export const formatMoney = (value) => moneyFormatter().format(value ?? 0);

/** @deprecated Usa formatMoney */
export const formatEur = formatMoney;

/** @deprecated Usa formatMoney */
export const formatEurExact = formatMoney;

export const formatMoneyCompact = (value) =>
  moneyCompactFormatter().format(value ?? 0);

export const formatPercent = (value) =>
  percentFormatter().format(value ?? 0);
