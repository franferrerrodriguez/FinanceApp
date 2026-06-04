import { DEFAULT_LOCALE, LOCALE_BCP47, SUPPORTED_LOCALES } from '../i18n/config.js';
import en from '../locales/en.json' with { type: 'json' };
import es from '../locales/es.json' with { type: 'json' };

const MONTH_NAMES = {
  es: es.common.months,
  en: en.common.months,
};

export function normalizeAppLocale(language) {
  const raw = language ?? DEFAULT_LOCALE;
  const base = String(raw).split('-')[0];
  return SUPPORTED_LOCALES.includes(base) ? base : DEFAULT_LOCALE;
}

export function resolveIntlLocale(language) {
  const base = normalizeAppLocale(language);
  return LOCALE_BCP47[base] ?? LOCALE_BCP47.es;
}

function monthNameForKey(monthKey, language) {
  const [, monthNum] = monthKey.split('-').map(Number);
  const lang = normalizeAppLocale(language);
  return (
    MONTH_NAMES[lang]?.[String(monthNum)] ??
    MONTH_NAMES[DEFAULT_LOCALE]?.[String(monthNum)] ??
    monthKey
  );
}

/** Compact label for tables (e.g. "Junio 26"). */
export function formatMonthKey(monthKey, language) {
  const [year] = monthKey.split('-').map(Number);
  if (!Number.isFinite(year)) return monthKey;
  return `${monthNameForKey(monthKey, language)} ${String(year).slice(-2)}`;
}

/** Full label for pickers (e.g. "Junio 2026"). */
export function formatMonthKeyLong(monthKey, language) {
  const [year] = monthKey.split('-').map(Number);
  if (!Number.isFinite(year)) return monthKey;
  return `${monthNameForKey(monthKey, language)} ${year}`;
}

/** @deprecated Use formatMonthKey */
export const formatMonthKeyLabel = formatMonthKey;
