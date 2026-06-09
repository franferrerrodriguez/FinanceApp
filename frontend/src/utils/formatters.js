import { normalizeEuros } from '../lib/money.js';
import { resolveIntlLocale } from './monthLabel.js';

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

function ratePercentFormatter() {
  return new Intl.NumberFormat(getIntlLocale(), {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

/** TIN / mortgage rate — 2 decimals, matches user input (2,25 %). */
export const formatRatePercent = (value) =>
  ratePercentFormatter().format(value ?? 0);

/** Decimal rate 0.0225 → 2.25 for <input type="number">. */
export function pctToDisplay(decimal) {
  return Math.round((decimal ?? 0) * 10000) / 100;
}

/** User input "2,25" or "2.25" → decimal 0.0225. */
export function displayToPct(value) {
  const n = parseFloat(String(value).trim().replace(',', '.'));
  return Number.isFinite(n) ? n / 100 : 0;
}

/** Free-text rate field: decimal → "2,25". */
export function formatRateInputValue(decimal, language) {
  if (decimal == null || !Number.isFinite(Number(decimal))) return '';
  const pct = normalizeEuros((decimal ?? 0) * 100);
  return new Intl.NumberFormat(resolveIntlLocale(language), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(pct);
}
