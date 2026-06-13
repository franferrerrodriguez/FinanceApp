import { AMORTIZATION_COLUMN } from '../modules/balance/amortizationTableColumns.js';
import { PROJECTION_COLUMN } from '../modules/projection/projectionTableColumns.js';

export const TABLE_CELL_TONE = {
  neutral: {
    header: '',
    body: '',
  },
  liability: {
    header: 'bg-[rgba(226,75,74,0.10)] font-semibold text-[var(--color-negative)]',
    body: 'font-medium text-[var(--color-negative)]',
    bodyBg: 'bg-[rgba(226,75,74,0.05)]',
  },
  contribution: {
    header: 'bg-[rgba(29,158,117,0.10)] font-semibold text-[var(--color-positive)]',
    body: 'font-medium text-[var(--color-positive)]',
    bodyBg: 'bg-[rgba(29,158,117,0.05)]',
  },
  interest: {
    header: 'bg-[rgba(239,159,39,0.10)] font-semibold text-[var(--color-warning)]',
    body: 'font-medium text-[var(--color-warning)]',
    bodyBg: 'bg-[rgba(239,159,39,0.05)]',
  },
  payment: {
    header: 'bg-[rgba(255,255,255,0.06)] font-semibold text-[var(--text-primary)]',
    body: 'font-medium text-[var(--text-primary)]',
    bodyBg: 'bg-[rgba(255,255,255,0.03)]',
  },
  income: {
    header: 'bg-[rgba(55,138,221,0.10)] font-semibold text-[var(--color-info)]',
    body: 'font-medium text-[var(--color-info)]',
    bodyBg: 'bg-[rgba(55,138,221,0.05)]',
  },
  expense: {
    header: 'bg-[rgba(239,159,39,0.08)] font-semibold text-[var(--color-warning)]',
    body: 'font-medium text-[var(--color-warning)]',
    bodyBg: 'bg-[rgba(239,159,39,0.04)]',
  },
  patrimony: {
    header: 'bg-[rgba(29,158,117,0.12)] font-bold text-[var(--color-positive)]',
    body: 'font-bold text-[var(--color-positive)]',
    bodyBg: 'bg-[rgba(29,158,117,0.06)]',
  },
  return: {
    header: 'bg-[rgba(55,138,221,0.08)] font-semibold text-[var(--color-info)]',
    body: 'font-medium text-[var(--color-info)]',
    bodyBg: 'bg-[rgba(55,138,221,0.04)]',
  },
  share: {
    header: 'bg-[rgba(93,202,165,0.10)] font-semibold text-[var(--accent-light)]',
    body: 'font-medium text-[var(--accent-light)]',
    bodyBg: 'bg-[rgba(93,202,165,0.05)]',
  },
};

const AMORTIZATION_COLUMN_TONE = {
  [AMORTIZATION_COLUMN.DATE]: 'neutral',
  [AMORTIZATION_COLUMN.PAYMENT]: 'payment',
  [AMORTIZATION_COLUMN.PRINCIPAL]: 'contribution',
  [AMORTIZATION_COLUMN.INTEREST]: 'interest',
  [AMORTIZATION_COLUMN.START_BALANCE]: 'liability',
  [AMORTIZATION_COLUMN.BALANCE]: 'liability',
  [AMORTIZATION_COLUMN.YOUR_SHARE]: 'share',
};

const PROJECTION_COLUMN_TONE = {
  [PROJECTION_COLUMN.YEAR]: 'neutral',
  [PROJECTION_COLUMN.DATE]: 'neutral',
  [PROJECTION_COLUMN.SALARY]: 'income',
  [PROJECTION_COLUMN.FIXED]: 'expense',
  [PROJECTION_COLUMN.MORTGAGE]: 'expense',
  [PROJECTION_COLUMN.GROCERIES]: 'expense',
  [PROJECTION_COLUMN.LEISURE]: 'expense',
  [PROJECTION_COLUMN.PUNCTUAL]: 'expense',
  [PROJECTION_COLUMN.NET_CONTRIBUTION]: 'contribution',
  [PROJECTION_COLUMN.INVESTMENTS]: 'expense',
  [PROJECTION_COLUMN.MORTGAGE_INTEREST]: 'interest',
  [PROJECTION_COLUMN.MORTGAGE_PRINCIPAL]: 'contribution',
  [PROJECTION_COLUMN.DEBT_BALANCE]: 'liability',
  [PROJECTION_COLUMN.MONTHLY_RETURN]: 'return',
  [PROJECTION_COLUMN.PATRIMONY]: 'contribution',
};

export function getAmortizationColumnTone(columnKey) {
  return AMORTIZATION_COLUMN_TONE[columnKey] ?? 'neutral';
}

export function getProjectionColumnTone(columnKey) {
  return PROJECTION_COLUMN_TONE[columnKey] ?? 'neutral';
}

export function tableCellToneClasses(toneKey, { header = false, withBg = true } = {}) {
  const tone = TABLE_CELL_TONE[toneKey] ?? TABLE_CELL_TONE.neutral;
  if (header) return tone.header;
  const parts = [tone.body];
  if (withBg && tone.bodyBg) parts.push(tone.bodyBg);
  return parts.filter(Boolean).join(' ');
}
