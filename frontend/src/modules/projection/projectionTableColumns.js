export const PROJECTION_COLUMN = {
  DATE: 'date',
  SALARY: 'salary',
  FIXED: 'fixed',
  VARIABLE: 'variable',
  NET_CONTRIBUTION: 'netContribution',
  INVESTMENTS: 'investments',
  MONTHLY_RETURN: 'monthlyReturn',
  PATRIMONY: 'patrimony',
  PUNCTUAL: 'punctual',
};

export const BASE_COLUMN_KEYS = [
  PROJECTION_COLUMN.DATE,
  PROJECTION_COLUMN.SALARY,
  PROJECTION_COLUMN.FIXED,
  PROJECTION_COLUMN.VARIABLE,
  PROJECTION_COLUMN.NET_CONTRIBUTION,
  PROJECTION_COLUMN.INVESTMENTS,
  PROJECTION_COLUMN.MONTHLY_RETURN,
  PROJECTION_COLUMN.PATRIMONY,
];

export const PUNCTUAL_COLUMN_KEY = PROJECTION_COLUMN.PUNCTUAL;

/** px — mobile headers use full phrases (see *Short in locales) */
const COLUMN_WIDTH_PX = {
  date: { narrow: 84, wide: 116 },
  salary: { narrow: 104, wide: 108 },
  fixed: { narrow: 112, wide: 104 },
  variable: { narrow: 124, wide: 108 },
  punctual: { narrow: 124, wide: 104 },
  netContribution: { narrow: 120, wide: 120 },
  investments: { narrow: 124, wide: 116 },
  monthlyReturn: { narrow: 116, wide: 116 },
  patrimony: { narrow: 116, wide: 128 },
};

export function buildProjectionColumnKeys(showPunctual) {
  if (!showPunctual) return [...BASE_COLUMN_KEYS];
  const idx = BASE_COLUMN_KEYS.indexOf(PROJECTION_COLUMN.NET_CONTRIBUTION);
  return [
    ...BASE_COLUMN_KEYS.slice(0, idx),
    PUNCTUAL_COLUMN_KEY,
    ...BASE_COLUMN_KEYS.slice(idx),
  ];
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

/** Columns grow to fill the table width; minWidth keeps horizontal scroll when needed. */
export function columnFlexStyle(key, narrow) {
  const w = getColumnWidthPx(key, narrow);
  return {
    minWidth: w,
    flex: `1 1 ${w}px`,
  };
}

export const tableRowLayoutStyle = (tableMinWidth) => ({
  width: '100%',
  minWidth: tableMinWidth,
});

export function headerLabelKey(key, narrow) {
  return narrow && key !== PROJECTION_COLUMN.DATE
    ? `projection.table.${key}Short`
    : `projection.table.${key}`;
}
