import { AMORTIZATION_COLUMN } from '../modules/balance/amortizationTableColumns.js';
import { PROJECTION_COLUMN } from '../modules/projection/projectionTableColumns.js';

export const TABLE_CELL_TONE = {
  neutral: {
    header: '',
    body: '',
  },
  liability: {
    header:
      'bg-red-50 font-semibold text-red-800 dark:bg-red-950/45 dark:text-red-300',
    body: 'font-medium text-red-700 dark:text-red-400',
    bodyBg: 'bg-red-50/55 dark:bg-red-950/20',
  },
  contribution: {
    header:
      'bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-950/45 dark:text-emerald-300',
    body: 'font-medium text-emerald-700 dark:text-emerald-400',
    bodyBg: 'bg-emerald-50/50 dark:bg-emerald-950/18',
  },
  interest: {
    header:
      'bg-orange-50 font-semibold text-orange-800 dark:bg-orange-950/45 dark:text-orange-300',
    body: 'font-medium text-orange-700 dark:text-orange-400',
    bodyBg: 'bg-orange-50/50 dark:bg-orange-950/18',
  },
  payment: {
    header:
      'bg-slate-100 font-semibold text-slate-800 dark:bg-slate-800/80 dark:text-slate-200',
    body: 'font-medium text-slate-800 dark:text-slate-200',
    bodyBg: 'bg-slate-100/60 dark:bg-slate-800/50',
  },
  income: {
    header:
      'bg-sky-50 font-semibold text-sky-800 dark:bg-sky-950/45 dark:text-sky-300',
    body: 'font-medium text-sky-700 dark:text-sky-400',
    bodyBg: 'bg-sky-50/50 dark:bg-sky-950/18',
  },
  expense: {
    header:
      'bg-amber-50 font-semibold text-amber-900 dark:bg-amber-950/45 dark:text-amber-300',
    body: 'font-medium text-amber-800 dark:text-amber-400',
    bodyBg: 'bg-amber-50/45 dark:bg-amber-950/15',
  },
  patrimony: {
    header:
      'bg-teal-50 font-bold text-teal-900 dark:bg-teal-950/50 dark:text-teal-300',
    body: 'font-bold text-teal-800 dark:text-teal-300',
    bodyBg: 'bg-teal-50/65 dark:bg-teal-950/28',
  },
  return: {
    header:
      'bg-violet-50 font-semibold text-violet-800 dark:bg-violet-950/45 dark:text-violet-300',
    body: 'font-medium text-violet-700 dark:text-violet-400',
    bodyBg: 'bg-violet-50/50 dark:bg-violet-950/18',
  },
  share: {
    header:
      'bg-indigo-50/90 font-semibold text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200',
    body: 'font-medium text-indigo-800 dark:text-indigo-300',
    bodyBg: 'bg-indigo-50/55 dark:bg-indigo-950/22',
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
