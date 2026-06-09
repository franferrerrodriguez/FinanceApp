export const PROJECTION_COLUMN = {
  YEAR: 'year',
  DATE: 'date',
  SALARY: 'salary',
  FIXED: 'fixed',
  GROCERIES: 'groceries',
  LEISURE: 'leisure',
  NET_CONTRIBUTION: 'netContribution',
  INVESTMENTS: 'investments',
  MONTHLY_RETURN: 'monthlyReturn',
  PATRIMONY: 'patrimony',
  PUNCTUAL: 'punctual',
};

export const BASE_COLUMN_KEYS = [
  PROJECTION_COLUMN.YEAR,
  PROJECTION_COLUMN.DATE,
  PROJECTION_COLUMN.SALARY,
  PROJECTION_COLUMN.FIXED,
  PROJECTION_COLUMN.GROCERIES,
  PROJECTION_COLUMN.LEISURE,
  PROJECTION_COLUMN.INVESTMENTS,
  PROJECTION_COLUMN.NET_CONTRIBUTION,
  PROJECTION_COLUMN.MONTHLY_RETURN,
  PROJECTION_COLUMN.PATRIMONY,
];

export const PUNCTUAL_COLUMN_KEY = PROJECTION_COLUMN.PUNCTUAL;

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
  groceries: { narrow: 108, wide: 112 },
  leisure: { narrow: 108, wide: 112 },
  punctual: { narrow: 124, wide: 104 },
  netContribution: { narrow: 112, wide: 120 },
  investments: { narrow: 112, wide: 120 },
  monthlyReturn: { narrow: 112, wide: 128 },
  patrimony: { narrow: 128, wide: 140 },
};

export function buildProjectionColumnKeys(showPunctual) {
  if (!showPunctual) return [...BASE_COLUMN_KEYS];
  const idx = BASE_COLUMN_KEYS.indexOf(PROJECTION_COLUMN.INVESTMENTS);
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

/** @deprecated use tableGridStyle — kept for tests if any */
export function columnFlexStyle(key, narrow) {
  const w = getColumnWidthPx(key, narrow);
  if (isFixedWidthColumn(key)) {
    return {
      flex: '0 0 auto',
      width: w,
    };
  }
  return {
    flex: '1 1 0',
    minWidth: w,
  };
}

export function columnPaddingClass(key) {
  return isFixedWidthColumn(key) ? 'px-1 sm:px-1.5' : 'px-2 sm:px-3';
}

export function showColumnSeparator(columnKey, columnKeys) {
  return columnKeys[columnKeys.length - 1] !== columnKey;
}

export const tableRowLayoutStyle = (tableMinWidth) => ({
  width: '100%',
  minWidth: tableMinWidth,
});

export function headerLabelKey(key, narrow) {
  if (key === PROJECTION_COLUMN.YEAR) {
    return narrow ? 'projection.table.yearShort' : 'projection.table.year';
  }
  if (key === PROJECTION_COLUMN.GROCERIES && narrow) {
    return 'projection.table.groceriesShort';
  }
  if (key === PROJECTION_COLUMN.PATRIMONY && narrow) {
    return 'projection.table.patrimonyShort';
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
  if (key === PROJECTION_COLUMN.DATE) return getColumnWidthPx(PROJECTION_COLUMN.YEAR, narrow);
  return null;
}
