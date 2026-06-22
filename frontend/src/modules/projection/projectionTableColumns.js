export const PROJECTION_COLUMN = {
  YEAR: 'year',
  DATE: 'date',
  SALARY: 'salary',
  FIXED: 'fixed',
  MORTGAGE: 'mortgage',
  GROCERIES: 'groceries',
  LEISURE: 'leisure',
  PUNCTUAL: 'punctual',
  INVESTMENTS: 'investments',
  MORTGAGE_INTEREST: 'mortgageInterest',
  MORTGAGE_PRINCIPAL: 'mortgagePrincipal',
  DEBT_BALANCE: 'debtBalance',
  NET_CONTRIBUTION: 'netContribution',
  MONTHLY_RETURN: 'monthlyReturn',
  PATRIMONY: 'patrimony',
};

const MORTGAGE_DETAIL_COLUMN_KEYS = [
  PROJECTION_COLUMN.MORTGAGE_INTEREST,
  PROJECTION_COLUMN.MORTGAGE_PRINCIPAL,
  PROJECTION_COLUMN.DEBT_BALANCE,
];

/** Fixed-width columns (year, date) use exact px; others use minWidth + flex grow. */
const FIXED_WIDTH_COLUMNS = new Set([
  PROJECTION_COLUMN.YEAR,
  PROJECTION_COLUMN.DATE,
]);

/** px — mobile headers use full phrases (see *Short in locales) */
const COLUMN_WIDTH_PX = {
  year: { narrow: 28, wide: 32 },
  date: { narrow: 44, wide: 48 },
  salary: { narrow: 112, wide: 120 },
  fixed: { narrow: 120, wide: 128 },
  mortgage: { narrow: 108, wide: 112 },
  groceries: { narrow: 108, wide: 112 },
  leisure: { narrow: 108, wide: 112 },
  punctual: { narrow: 124, wide: 104 },
  investments: { narrow: 112, wide: 120 },
  mortgageInterest: { narrow: 112, wide: 128 },
  mortgagePrincipal: { narrow: 112, wide: 128 },
  debtBalance: { narrow: 112, wide: 128 },
  netContribution: { narrow: 112, wide: 120 },
  monthlyReturn: { narrow: 112, wide: 128 },
  patrimony: { narrow: 128, wide: 140 },
};

export function buildProjectionColumnKeys({
  showPunctual = false,
  showMortgageDetail = false,
  mortgageAmortizationActive = false,
} = {}) {
  const keys = [
    PROJECTION_COLUMN.YEAR,
    PROJECTION_COLUMN.DATE,
    PROJECTION_COLUMN.SALARY,
    PROJECTION_COLUMN.FIXED,
  ];
  if (mortgageAmortizationActive) keys.push(PROJECTION_COLUMN.MORTGAGE);
  keys.push(PROJECTION_COLUMN.GROCERIES, PROJECTION_COLUMN.LEISURE);
  if (showPunctual) keys.push(PROJECTION_COLUMN.PUNCTUAL);
  keys.push(PROJECTION_COLUMN.INVESTMENTS);
  if (showMortgageDetail && mortgageAmortizationActive) {
    keys.push(...MORTGAGE_DETAIL_COLUMN_KEYS);
  }
  keys.push(
    PROJECTION_COLUMN.NET_CONTRIBUTION,
    PROJECTION_COLUMN.MONTHLY_RETURN,
    PROJECTION_COLUMN.PATRIMONY,
  );
  return keys;
}

export function getColumnWidthPx(key, narrow) {
  const spec = COLUMN_WIDTH_PX[key];
  return narrow ? spec.narrow : spec.wide;
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

export function headerLabelKey(key, narrow) {
  if (key === PROJECTION_COLUMN.YEAR) {
    return narrow ? 'projection.table.yearShort' : 'projection.table.year';
  }
  if (key === PROJECTION_COLUMN.MORTGAGE && narrow) {
    return 'projection.table.mortgageShort';
  }
  if (key === PROJECTION_COLUMN.GROCERIES && narrow) {
    return 'projection.table.groceriesShort';
  }
  if (key === PROJECTION_COLUMN.PATRIMONY && narrow) {
    return 'projection.table.patrimonyNetShort';
  }
  if (key === PROJECTION_COLUMN.MORTGAGE_INTEREST && narrow) {
    return 'projection.table.mortgageInterestShort';
  }
  if (key === PROJECTION_COLUMN.MORTGAGE_PRINCIPAL && narrow) {
    return 'projection.table.mortgagePrincipalShort';
  }
  if (key === PROJECTION_COLUMN.DEBT_BALANCE && narrow) {
    return 'projection.table.debtBalanceShort';
  }
  return `projection.table.${key}`;
}

export function headerTooltipKey(key) {
  if (key === PROJECTION_COLUMN.YEAR || key === PROJECTION_COLUMN.PUNCTUAL) {
    return null;
  }
  return `projection.table.tooltips.${key}`;
}

export function stickyColumnLeftOffset(key, narrow) {
  if (key === PROJECTION_COLUMN.YEAR) return 0;
  if (key === PROJECTION_COLUMN.DATE) {
    return getColumnWidthPx(PROJECTION_COLUMN.YEAR, narrow);
  }
  return null;
}
