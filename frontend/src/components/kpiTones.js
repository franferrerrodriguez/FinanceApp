import { DEFAULT_SETTINGS } from '../lib/constants';
import { ui } from '../lib/uiClasses';

export function getSavingsTone(rate) {
  if (rate >= DEFAULT_SETTINGS.SAVINGS_RATE_GREEN) return 'savings';
  if (rate >= DEFAULT_SETTINGS.SAVINGS_RATE_YELLOW) return 'warn';
  return 'danger';
}

export function getNetWorthTone(netWorth) {
  if (netWorth == null || !Number.isFinite(netWorth)) return 'default';
  if (netWorth < 0) return 'danger';
  return 'netWorth';
}

/** Shared KPI value colors — map to DS semantic tokens. */
export const KPI_VALUE_TONE_CLASS = {
  default: ui.heading,
  netWorth: 'text-[var(--color-positive)]',
  assets: 'text-[var(--color-info)]',
  positive: 'text-[var(--color-positive)]',
  income: 'text-[var(--color-info)]',
  savings: 'text-[var(--color-positive)]',
  expense: 'text-[var(--color-negative)]',
  leisure: 'text-[var(--color-warning)]',
  warn: 'text-[var(--color-warning)]',
  danger: 'text-[var(--color-negative)]',
  liability: 'text-[var(--color-negative)]',
};

export function getKpiValueClass(tone = 'default') {
  return KPI_VALUE_TONE_CLASS[tone] ?? KPI_VALUE_TONE_CLASS.default;
}
