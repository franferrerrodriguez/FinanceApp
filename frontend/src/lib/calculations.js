import {
  applyShareEuros,
  subtractEuros,
  sumEuros,
} from './money.js';
import { getEffectiveMonthlySalary } from './salary.js';
import {
  resolveMonthlySalaryForDate,
  resolveSettingsForDate,
} from './cashflowHistory.js';
import { getPunctualExpensesForDate } from './annualExpenses.js';
import { normalizeProjectionYears } from './constants.js';
import {
  applyMonthToBucketState,
  buildInitialBucketState,
  computeBucketAnnualRates,
  computeWeightedPortfolioReturn,
  netWorthFromState,
  splitContributionBreakdownToBuckets,
} from './projectionBuckets.js';
import { resolveInvestmentFromBreakdown } from './contributionEntries.js';
import { resolveContributionsForProjectionMonth } from './contributionProjection.js';

export const applyYourShare = applyShareEuros;

export const nominalToReal = (nominalRate, inflationRate) =>
  (1 + nominalRate) / (1 + inflationRate) - 1;

/**
 * Equivalent monthly rate: (1 + r_annual)^(1/12) − 1.
 * NEVER use r_annual / 12: it understates compound interest.
 */
export const annualToMonthlyRate = (annualRate) =>
  Math.pow(1 + (annualRate ?? 0), 1 / 12) - 1;

/** @alias annualToMonthlyRate */
export const annualToMonthly = annualToMonthlyRate;

export const futureValueContributions = (monthlyContrib, annualRate, years) => {
  const r = annualToMonthly(annualRate);
  const n = years * 12;
  if (r === 0) return monthlyContrib * n;
  return monthlyContrib * ((Math.pow(1 + r, n) - 1) / r);
};

export const futureValueLumpSum = (presentValue, annualRate, years) =>
  presentValue * Math.pow(1 + annualRate, years);

export const buildProjectionTable = ({
  initialPatrimony,
  monthlyContrib,
  annualRate,
  years,
  annualSalaryIncrease = 0.013,
  contribGrowsWithSalary = false,
}) => {
  const table = [];
  let patrimonioInicio = initialPatrimony;
  let contrib = monthlyContrib;
  let totalAportaciones = 0;

  for (let year = 1; year <= years; year++) {
    if (contribGrowsWithSalary && year > 1) {
      contrib *= 1 + annualSalaryIncrease;
    }

    const r = annualToMonthly(annualRate);
    const fvCapital = patrimonioInicio * Math.pow(1 + annualRate, 1);
    const fvContrib =
      r === 0 ? contrib * 12 : contrib * ((Math.pow(1 + r, 12) - 1) / r);

    const patrimonioFin = fvCapital + fvContrib;
    const aportacionAnual = contrib * 12;
    totalAportaciones += aportacionAnual;
    const interesGenerado =
      patrimonioFin - initialPatrimony - totalAportaciones;

    table.push({
      year,
      patrimonioInicio: Math.round(patrimonioInicio),
      aportacionAnual: Math.round(aportacionAnual),
      rentabilidadGenerada: Math.round(
        patrimonioFin - patrimonioInicio - aportacionAnual,
      ),
      patrimonioFin: Math.round(patrimonioFin),
      totalAportaciones: Math.round(totalAportaciones),
      interesCompuestoTotal: Math.round(interesGenerado),
    });

    patrimonioInicio = patrimonioFin;
  }

  return table;
};

export const calcFIREYear = (projectionTable, annualExpenses, annualRate) =>
  projectionTable.find(
    (row) => row.patrimonioFin * annualRate >= annualExpenses,
  )?.year ?? null;

export const calcNetWorth = (snapshots) =>
  sumEuros(...snapshots.map((s) => s.value ?? 0));

/** Household total before split (simple block or breakdown). */
export const getHouseholdTotal = (settings) => {
  if (!settings) return 0;
  if (settings.useDetailedExpenses) {
    return sumEuros(
      settings.utilities ?? 0,
      settings.insurance ?? 0,
      settings.subscriptions ?? 0,
      settings.otherFixedExpenses ?? 0,
    );
  }
  if (settings.householdFixedEstimate != null) {
    return settings.householdFixedEstimate;
  }
  return sumEuros(
    settings.utilities ?? 0,
    settings.insurance ?? 0,
    settings.subscriptions ?? 0,
    settings.otherFixedExpenses ?? 0,
  );
};

export const getEffectiveHouseholdExpenses = (settings) =>
  applyShareEuros(
    getHouseholdTotal(settings),
    settings?.householdFixedShared,
    settings?.householdFixedYourSharePercent,
  );

export const getGroceriesTotal = (settings) => settings?.groceriesEstimate ?? 0;

export const getEffectiveGroceries = (settings) =>
  applyShareEuros(
    getGroceriesTotal(settings),
    settings?.groceriesShared,
    settings?.groceriesYourSharePercent,
  );

export const getLeisureTotal = (settings) => settings?.leisureEstimate ?? 0;

export const getEffectiveLeisureExpenses = (settings) =>
  applyShareEuros(
    getLeisureTotal(settings),
    settings?.leisureShared,
    settings?.leisureYourSharePercent,
  );

/** @deprecated Use getEffectiveHouseholdExpenses */
export const getHouseholdExpenses = getEffectiveHouseholdExpenses;

/** @deprecated Use getEffectiveLeisureExpenses */
export const getLeisureExpenses = getEffectiveLeisureExpenses;

export const calcTotalVariableExpenses = (settings) =>
  getEffectiveLeisureExpenses(settings);

export const getMortgageRentTotal = (settings) => {
  if (!settings) return 0;
  return settings.mortgageRentTotal ?? settings.mortgageRent ?? 0;
};

export const getEffectiveMortgageRent = (settings) =>
  applyShareEuros(
    getMortgageRentTotal(settings),
    settings?.mortgageRentShared,
    settings?.mortgageRentYourSharePercent,
  );

export const getEffectiveBudgetInvestment = (settings) =>
  Math.max(0, Number(settings?.monthlyBudgetInvestment) || 0);

export const calcTotalFixedExpenses = (settings) => {
  if (!settings) return 0;
  return sumEuros(
    getEffectiveMortgageRent(settings),
    getEffectiveHouseholdExpenses(settings),
    getEffectiveGroceries(settings),
  );
};

export const calcTotalMonthlyOutflow = (settings, monthlyInvestment) => {
  const fixed = calcTotalFixedExpenses(settings);
  const variable = calcTotalVariableExpenses(settings);
  const investment =
    monthlyInvestment !== undefined
      ? monthlyInvestment
      : getEffectiveBudgetInvestment(settings);
  return sumEuros(fixed, variable, investment);
};

export const calcTotalIncome = (settings) => {
  if (!settings) return 0;
  return sumEuros(
    getEffectiveMonthlySalary(settings),
    settings.otherMonthlyIncome ?? 0,
  );
};

export const calcSavingsRate = (totalIncome, fixedExpenses, varExpenses = 0) => {
  if (totalIncome <= 0) return 0;
  const savings = subtractEuros(totalIncome, fixedExpenses, varExpenses);
  return Math.max(0, savings / totalIncome);
};

export const calcFreeCashflow = (
  totalIncome,
  fixedExpenses,
  monthlyInvestment,
  variableExpenses = 0,
) =>
  subtractEuros(
    totalIncome,
    fixedExpenses,
    variableExpenses,
    monthlyInvestment,
  );

export function hasAnySharedExpense(settings) {
  if (!settings) return false;
  return (
    settings.mortgageRentShared ||
    settings.householdFixedShared ||
    settings.groceriesShared ||
    settings.leisureShared
  );
}

// ——— Monthly projection (source of truth) ———

/** Scale a base amount by full years elapsed (months 0–11 → 0, 12–23 → 1…). */
export function scaleByAnnualSteps(baseAmount, monthIndex, annualIncrease) {
  const yearsElapsed = Math.floor(monthIndex / 12);
  if (!annualIncrease || yearsElapsed <= 0) return baseAmount;
  return baseAmount * Math.pow(1 + annualIncrease, yearsElapsed);
}

function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function addMonths(date, count) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function getProjectionStartDate(fromDate = new Date()) {
  return new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 1);
}

function monthKeyFromDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Monthly projection table (pure calculation).
 * @param {object} params
 * @param {object} params.settings
 * @param {object[]} [params.contributionPlans]
 * @param {object[]} [params.contributionEntries]
 * @param {number} [params.initialPatrimony]
 * @param {Date} [params.startDate]
 * @param {number} [params.years]
 * @param {number} [params.annualRate] @deprecated use bucket rates
 * @param {(plans: object[], monthIndex: number) => number} [params.getInvestmentContributions]
 * @param {object[]} [params.assets]
 * @param {object[]} [params.liabilities]
 * @param {object[]} [params.snapshots]
 * @param {Array<{ id: string, name: string, amount: number, month: number }>} [params.annualExpenses]
 * @param {Array<object>} [params.cashflowHistory]
 * @param {Array<object>} [params.salaryHistory] @deprecated use cashflowHistory
 */
export function buildMonthlyProjectionRows({
  settings,
  contributionPlans = [],
  contributionEntries = [],
  annualExpenses = [],
  cashflowHistory = [],
  salaryHistory = [],
  assets = [],
  liabilities = [],
  snapshots = [],
  initialPatrimony = 0,
  startDate,
  years,
  annualRate: _legacyAnnualRate,
  getInvestmentContributions,
}) {
  const history =
    cashflowHistory.length > 0 ? cashflowHistory : salaryHistory;

  const horizonYears = normalizeProjectionYears(
    years ?? settings?.projectionYears,
  );
  const monthCount = horizonYears * 12;
  const start = startDate ?? getProjectionStartDate();

  const expenseIncrease = settings?.projectionAnnualExpenseIncrease ?? 0;

  const initialState = buildInitialBucketState({
    settings,
    assets,
    liabilities,
    snapshots,
    initialPatrimony: initialPatrimony ?? settings?.initialPatrimony ?? 0,
  });

  let buckets = { ...initialState.buckets };
  let debtBalance = initialState.debtBalance;
  let bucketRates = { ...initialState.bucketRates };
  const rows = [];

  for (let monthIndex = 0; monthIndex < monthCount; monthIndex++) {
    const yearsElapsed = Math.floor(monthIndex / 12);
    const date = addMonths(start, monthIndex);
    const monthSettings = resolveSettingsForDate(settings, history, date);
    const salary = roundMoney(
      resolveMonthlySalaryForDate(settings, history, date),
    );
    const baseFixed = calcTotalFixedExpenses(monthSettings);
    const baseVariable = calcTotalVariableExpenses(monthSettings);
    const otherIncome = monthSettings?.otherMonthlyIncome ?? 0;
    const fixedExpenses = roundMoney(
      scaleByAnnualSteps(baseFixed, monthIndex, expenseIncrease),
    );
    const variableExpenses = roundMoney(
      scaleByAnnualSteps(baseVariable, monthIndex, expenseIncrease),
    );
    const monthKey = monthKeyFromDate(date);
    const punctualExpenses = roundMoney(
      getPunctualExpensesForDate(annualExpenses, date),
    );
    const netContribution = roundMoney(
      salary +
        otherIncome -
        fixedExpenses -
        variableExpenses -
        punctualExpenses,
    );

    const contributionResult = resolveContributionsForProjectionMonth({
      entries: contributionEntries,
      contributionPlans,
      assets,
      settings: monthSettings,
      snapshots,
      monthKey,
      monthIndex,
      netContribution,
    });
    const additionalInvestments = roundMoney(
      getInvestmentContributions
        ? getInvestmentContributions(contributionPlans, monthIndex, monthKey)
        : resolveInvestmentFromBreakdown(contributionResult.breakdown),
    );

    const patrimonioInicio = roundMoney(netWorthFromState(buckets, debtBalance));
    bucketRates = computeBucketAnnualRates({
      settings,
      assets,
      snapshots,
      buckets,
    });
    const appliedWeightedReturn = computeWeightedPortfolioReturn(
      buckets,
      bucketRates,
    );

    const bucketContributions = splitContributionBreakdownToBuckets(
      contributionResult.breakdown,
      netContribution,
    );

    const monthResult = applyMonthToBucketState({
      buckets,
      debtBalance,
      bucketRates,
      bucketContributions,
      liabilities,
      settings: monthSettings,
    });

    buckets = monthResult.buckets;
    debtBalance = monthResult.debtBalance;
    const monthlyReturn = roundMoney(monthResult.monthlyReturn);
    const patrimonioFin = roundMoney(monthResult.netWorth);

    rows.push({
      monthIndex,
      yearsElapsed,
      date,
      isJanuary: date.getMonth() === 0,
      salary,
      otherIncome: roundMoney(otherIncome),
      fixedExpenses,
      variableExpenses,
      additionalInvestments,
      punctualExpenses,
      netContribution,
      monthlyReturn,
      patrimonioInicio,
      patrimonyEnd: patrimonioFin,
      appliedAnnualRate: appliedWeightedReturn,
      appliedWeightedReturn,
      appliedMonthlyRate: annualToMonthlyRate(appliedWeightedReturn),
      bucketBalances: { ...buckets },
      debtBalance: roundMoney(debtBalance),
    });
  }

  return rows;
}

export function summarizeProjectionRows(rows, initialPatrimony = 0) {
  const initial = roundMoney(initialPatrimony);
  if (!rows.length) {
    return {
      initialPatrimony: initial,
      finalPatrimony: initial,
      totalNetContributed: 0,
      totalReturnGenerated: 0,
      averageSavingsRate: 0,
      isCoherent: true,
    };
  }

  const totalNetContributed = roundMoney(
    rows.reduce((s, r) => s + r.netContribution, 0),
  );
  const totalReturnGenerated = roundMoney(
    rows.reduce((s, r) => s + r.monthlyReturn, 0),
  );
  const finalPatrimony = rows[rows.length - 1].patrimonyEnd;
  const expectedFinal = roundMoney(
    initial + totalNetContributed + totalReturnGenerated,
  );
  const salarySum = rows.reduce((s, r) => s + r.salary, 0);
  const avgSalary = salarySum / rows.length;
  const avgNetContribution = totalNetContributed / rows.length;
  const averageSavingsRate =
    avgSalary > 0 ? Math.max(0, avgNetContribution / avgSalary) : 0;

  return {
    initialPatrimony: initial,
    finalPatrimony,
    totalNetContributed,
    totalReturnGenerated,
    averageSavingsRate,
    expectedFinal,
    isCoherent: Math.abs(finalPatrimony - expectedFinal) < 0.02,
  };
}
