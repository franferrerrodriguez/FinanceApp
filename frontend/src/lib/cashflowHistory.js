import { getLastNMonthKeys } from './dashboardMetrics.js';
import {
  calcCoreFixedExpenses,
  calcTotalFixedExpenses,
  calcTotalIncome,
  calcTotalVariableExpenses,
  getEffectiveBudgetInvestment,
  getEffectiveGroceries,
  getEffectiveLeisureExpenses,
} from './calculations.js';
import {
  computeMonthlyNetSalaryEffective,
  enrichSettingsWithSalary,
} from './salary.js';

/** Recent months for tramo dropdowns (newest first), including any persisted keys. */
export function buildEffectiveMonthOptions(extraMonthKeys = [], lookbackMonths = 36) {
  const set = new Set(getLastNMonthKeys(lookbackMonths));
  for (const key of extraMonthKeys ?? []) {
    if (key) set.add(key);
  }
  return [...set].sort((a, b) => b.localeCompare(a));
}

export function getCurrentMonthKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/** Expense fields snapshotted per tramo (shared splits, detailed mode, etc.). */
export const CASHFLOW_EXPENSE_SNAPSHOT_KEYS = [
  'useDetailedExpenses',
  'mortgageRent',
  'mortgageRentTotal',
  'mortgageRentShared',
  'mortgageRentYourSharePercent',
  'householdFixedEstimate',
  'householdFixedIsEstimate',
  'householdFixedShared',
  'householdFixedYourSharePercent',
  'utilities',
  'insurance',
  'subscriptions',
  'otherFixedExpenses',
  'groceriesEstimate',
  'groceriesIsEstimate',
  'groceriesShared',
  'groceriesYourSharePercent',
  'leisureEstimate',
  'leisureIsEstimate',
  'leisureShared',
  'leisureYourSharePercent',
  'monthlyBudgetInvestment',
  'emergencyFundCountsInvestment',
];

export function pickExpenseSnapshot(settings = {}) {
  return Object.fromEntries(
    CASHFLOW_EXPENSE_SNAPSHOT_KEYS.flatMap((key) => {
      const value = settings[key];
      if (value === undefined) return [];
      if (key === 'monthlyBudgetInvestment' && !(Number(value) > 0)) return [];
      return [[key, value]];
    }),
  );
}

/** Merge settings from local + persisted without losing a committed budget investment. */
export function mergeBudgetSettingsFields(current = {}, persisted = {}) {
  const monthlyBudgetInvestment = Math.max(
    getEffectiveBudgetInvestment(current),
    getEffectiveBudgetInvestment(persisted),
  );
  const emergencyFundCountsInvestment =
    current.emergencyFundCountsInvestment ??
    persisted.emergencyFundCountsInvestment;

  return {
    monthlyBudgetInvestment,
    ...(emergencyFundCountsInvestment !== undefined
      ? { emergencyFundCountsInvestment }
      : {}),
  };
}

function monthKeyFromDate(date) {
  if (!date) return getCurrentMonthKey();
  return getCurrentMonthKey(date);
}

function enrichCashflowTotals(entry, settingsBase = {}) {
  const merged = applyCashflowEntryToSettings(settingsBase, entry);
  return {
    ...entry,
    monthlyNetSalaryEffective:
      entry.monthlyNetSalaryEffective ??
      computeMonthlyNetSalaryEffective(entry),
    incomeMonthly: calcTotalIncome(merged),
    fixedExpensesMonthly: calcTotalFixedExpenses(merged),
    variableExpensesMonthly: calcTotalVariableExpenses(merged),
  };
}

export function applyCashflowEntryToSettings(settings, entry) {
  if (!entry) return settings ?? {};
  const base = { ...(settings ?? {}) };
  const withSalary = enrichSettingsWithSalary(
    {
      monthlyNetSalary: entry.monthlyNetSalary ?? 0,
      salaryPaysPreset: entry.salaryPaysPreset ?? '12',
      numPagas: entry.numPagas ?? 12,
    },
    base,
  );
  const expenseOverlay = Object.fromEntries(
    Object.entries(entry.expenses ?? {}).filter(([, value]) => value !== undefined),
  );
  return {
    ...withSalary,
    otherMonthlyIncome: entry.otherMonthlyIncome ?? 0,
    ...expenseOverlay,
  };
}

export function createCashflowEntry(partial = {}, settingsBase = {}) {
  const base = {
    id: partial.id ?? crypto.randomUUID?.() ?? `cf-${Date.now()}`,
    effectiveFrom: partial.effectiveFrom ?? getCurrentMonthKey(),
    monthlyNetSalary: Math.max(0, partial.monthlyNetSalary ?? 0),
    salaryPaysPreset: partial.salaryPaysPreset ?? '12',
    numPagas: partial.numPagas ?? 12,
    otherMonthlyIncome: Math.max(0, partial.otherMonthlyIncome ?? 0),
    expenses: partial.expenses ?? pickExpenseSnapshot(settingsBase),
    note: partial.note ?? '',
  };
  return enrichCashflowTotals(base, settingsBase);
}

export function createCashflowEntryFromSettings(settings, effectiveFrom, partial = {}) {
  return createCashflowEntry(
    {
      effectiveFrom,
      monthlyNetSalary: settings?.monthlyNetSalary ?? 0,
      salaryPaysPreset: settings?.salaryPaysPreset ?? '12',
      numPagas: settings?.numPagas ?? 12,
      otherMonthlyIncome: settings?.otherMonthlyIncome ?? 0,
      expenses: pickExpenseSnapshot(settings),
      ...partial,
    },
    settings,
  );
}

export function enrichCashflowEntry(patch, current = {}, settingsBase = {}) {
  const merged = {
    ...current,
    ...patch,
    expenses: {
      ...(current.expenses ?? {}),
      ...(patch.expenses ?? {}),
    },
  };
  const withSalary = enrichSettingsWithSalary(
    {
      monthlyNetSalary: merged.monthlyNetSalary,
      salaryPaysPreset: merged.salaryPaysPreset,
      numPagas: merged.numPagas,
    },
    merged,
  );
  return enrichCashflowTotals(
    {
      ...merged,
      monthlyNetSalaryEffective: computeMonthlyNetSalaryEffective(withSalary),
    },
    settingsBase,
  );
}

export function getCashflowSegmentForMonthKey(cashflowHistory, monthKey) {
  const sorted = [...(cashflowHistory ?? [])].sort((a, b) =>
    a.effectiveFrom.localeCompare(b.effectiveFrom),
  );
  let match = null;
  for (const entry of sorted) {
    if (entry.effectiveFrom <= monthKey) match = entry;
  }
  return match;
}

export function getCurrentCashflowSegment(cashflowHistory, date = new Date()) {
  return getCashflowSegmentForMonthKey(cashflowHistory, monthKeyFromDate(date));
}

export function isCurrentCashflowSegment(entry, cashflowHistory, date = new Date()) {
  const current = getCurrentCashflowSegment(cashflowHistory, date);
  return current?.id === entry.id;
}

/** Settings merged with the tramo that applies on `date` (for totals and projection). */
export function resolveSettingsForDate(settings, cashflowHistory, date) {
  const segment = getCashflowSegmentForMonthKey(
    cashflowHistory,
    monthKeyFromDate(date),
  );
  if (!segment) return enrichSettingsWithSalary({}, settings ?? {});
  return applyCashflowEntryToSettings(settings, segment);
}

export function resolveMonthlySalaryForDate(settings, cashflowHistory, date) {
  const resolved = resolveSettingsForDate(settings, cashflowHistory, date);
  return computeMonthlyNetSalaryEffective(resolved);
}

export function getCashflowTotalsForDate(settings, cashflowHistory, date = new Date()) {
  const resolved = resolveSettingsForDate(settings, cashflowHistory, date);
  const income = calcTotalIncome(resolved);
  const coreFixed = calcCoreFixedExpenses(resolved);
  const groceries = getEffectiveGroceries(resolved);
  const leisure = getEffectiveLeisureExpenses(resolved);
  const fixed = calcTotalFixedExpenses(resolved);
  const variable = calcTotalVariableExpenses(resolved);
  const investment = getEffectiveBudgetInvestment(resolved);
  const grossSavings = income - coreFixed - groceries - leisure;
  const savings = grossSavings - investment;
  const grossSavingsRate = income > 0 ? Math.max(0, grossSavings / income) : 0;
  const investmentRate = income > 0 ? Math.max(0, investment / income) : 0;
  const savingsRate = income > 0 ? Math.max(0, savings / income) : 0;
  return {
    income,
    coreFixed,
    groceries,
    leisure,
    fixed,
    variable,
    investment,
    grossSavings,
    grossSavingsRate,
    investmentRate,
    savings,
    savingsRate,
    resolved,
  };
}

/** Mirror the current tramo into settings (including zero salary / empty history). */
export function syncSettingsFromCashflowHistory(settings, cashflowHistory) {
  const segment = getCurrentCashflowSegment(cashflowHistory);
  if (!segment) {
    return enrichSettingsWithSalary(
      {
        monthlyNetSalary: 0,
        salaryPaysPreset: settings?.salaryPaysPreset ?? '12',
        numPagas: settings?.numPagas ?? 12,
      },
      settings ?? {},
    );
  }

  const expenseOverlay = Object.fromEntries(
    Object.entries(segment.expenses ?? {}).filter(([, value]) => value !== undefined),
  );
  let next = { ...settings, ...expenseOverlay };

  next = enrichSettingsWithSalary(
    {
      monthlyNetSalary: segment.monthlyNetSalary ?? 0,
      salaryPaysPreset: segment.salaryPaysPreset ?? '12',
      numPagas: segment.numPagas ?? 12,
    },
    next,
  );

  next.otherMonthlyIncome = segment.otherMonthlyIncome ?? 0;

  return next;
}

export function upsertCurrentMonthCashflowTramo(settings, cashflowHistory = []) {
  const key = getCurrentMonthKey();
  const draft = createCashflowEntryFromSettings(settings, key, {
    expenses: {
      ...pickExpenseSnapshot(settings),
      monthlyBudgetInvestment: getEffectiveBudgetInvestment(settings),
      emergencyFundCountsInvestment:
        settings?.emergencyFundCountsInvestment ?? true,
    },
  });
  const idx = cashflowHistory.findIndex((e) => e.effectiveFrom === key);
  if (idx >= 0) {
    return cashflowHistory.map((e, i) =>
      i === idx ? enrichCashflowEntry(draft, e, settings) : e,
    );
  }
  return [...cashflowHistory, draft];
}

/** @deprecated Use cashflowHistory; migrates legacy salary-only rows. */
export function migrateSalaryHistoryToCashflow(salaryHistory, settings) {
  return (salaryHistory ?? []).map((row) =>
    createCashflowEntryFromSettings(
      {
        ...settings,
        monthlyNetSalary: row.monthlyNetSalary,
        salaryPaysPreset: row.salaryPaysPreset,
        numPagas: row.numPagas,
      },
      row.effectiveFrom,
      { id: row.id },
    ),
  );
}
