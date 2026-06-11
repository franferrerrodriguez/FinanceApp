export const AMORTIZATION_COLUMN = {
  DATE: 'date',
  PAYMENT: 'payment',
  PRINCIPAL: 'principal',
  INTEREST: 'interest',
  START_BALANCE: 'startBalance',
  BALANCE: 'balance',
  YOUR_SHARE: 'yourShare',
};

export const AMORTIZATION_COLUMN_KEYS = [
  AMORTIZATION_COLUMN.DATE,
  AMORTIZATION_COLUMN.PAYMENT,
  AMORTIZATION_COLUMN.PRINCIPAL,
  AMORTIZATION_COLUMN.INTEREST,
  AMORTIZATION_COLUMN.START_BALANCE,
  AMORTIZATION_COLUMN.BALANCE,
];

export function buildAmortizationColumnKeys(sharePercent) {
  if (sharePercent == null || sharePercent >= 100) {
    return AMORTIZATION_COLUMN_KEYS;
  }
  return [...AMORTIZATION_COLUMN_KEYS, AMORTIZATION_COLUMN.YOUR_SHARE];
}

const FIXED_WIDTH_COLUMNS = new Set([AMORTIZATION_COLUMN.DATE]);

const COLUMN_WIDTH_PX = {
  date: { narrow: 72, wide: 84 },
  payment: { narrow: 88, wide: 96 },
  principal: { narrow: 88, wide: 96 },
  interest: { narrow: 88, wide: 96 },
  startBalance: { narrow: 100, wide: 112 },
  balance: { narrow: 108, wide: 124 },
  yourShare: { narrow: 96, wide: 108 },
};

export function getColumnWidthPx(key, narrow) {
  return COLUMN_WIDTH_PX[key][narrow ? 'narrow' : 'wide'];
}

export function getTableMinWidth(columnKeys, narrow) {
  return columnKeys.reduce(
    (sum, key) => sum + getColumnWidthPx(key, narrow),
    0,
  );
}

export function isFixedWidthColumn(key) {
  return FIXED_WIDTH_COLUMNS.has(key);
}

export function columnGridTemplate(columnKeys, narrow) {
  return columnKeys
    .map((key) => {
      const w = getColumnWidthPx(key, narrow);
      if (isFixedWidthColumn(key)) return `${w}px`;
      return `minmax(${w}px, 1fr)`;
    })
    .join(' ');
}

export function tableGridStyle(columnKeys, narrow) {
  return {
    display: 'grid',
    gridTemplateColumns: columnGridTemplate(columnKeys, narrow),
    width: '100%',
  };
}

export function columnPaddingClass(key) {
  return isFixedWidthColumn(key) ? 'px-1 sm:px-1.5' : 'px-2 sm:px-3';
}

export function showColumnSeparator(columnKey, columnKeys) {
  return columnKeys[columnKeys.length - 1] !== columnKey;
}

export function isYourShareColumn(columnKey) {
  return columnKey === AMORTIZATION_COLUMN.YOUR_SHARE;
}

export function headerLabelKey(key, narrow) {
  if (key === AMORTIZATION_COLUMN.START_BALANCE && narrow) {
    return 'balance.amortization.scheduleStartBalanceShort';
  }
  if (key === AMORTIZATION_COLUMN.BALANCE && narrow) {
    return 'balance.amortization.scheduleBalanceShort';
  }
  const labels = {
    date: 'scheduleDate',
    payment: 'schedulePayment',
    principal: 'schedulePrincipal',
    interest: 'scheduleInterest',
    startBalance: 'scheduleStartBalance',
    balance: 'scheduleBalance',
  };
  return `balance.amortization.${labels[key]}`;
}

export function stickyColumnLeftOffset(key) {
  if (key === AMORTIZATION_COLUMN.DATE) return 0;
  return null;
}
