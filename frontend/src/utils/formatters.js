import { resolveIntlLocale } from './monthLabel';

function getIntlLocale() {
  return resolveIntlLocale();
}

/** Standard format for EUR amounts (always 2 decimals). */
function moneyFormatter() {
  return new Intl.NumberFormat(getIntlLocale(), {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Chart axes and very large figures without decimals. */
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

/** Money amounts in UI (onboarding, dashboard, tables). */
export const formatMoney = (value) => moneyFormatter().format(value ?? 0);

/** @deprecated Use formatMoney */
export const formatEur = formatMoney;

/** @deprecated Use formatMoney */
export const formatEurExact = formatMoney;

export const formatMoneyCompact = (value) =>
  moneyCompactFormatter().format(value ?? 0);

export const formatPercent = (value) =>
  percentFormatter().format(value ?? 0);
