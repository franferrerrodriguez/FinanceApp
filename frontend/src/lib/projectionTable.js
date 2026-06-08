import {
  buildMonthlyProjectionRows,
  summarizeProjectionRows,
} from './calculations.js';
import { getProjectionStartingPatrimony } from './projectionBuckets.js';
import { getProjectionAnnualRate } from './projectionRates.js';

export { getProjectionAnnualRate } from './projectionRates.js';
export {
  annualToMonthlyRate,
  buildMonthlyProjectionRows,
  summarizeProjectionRows,
} from './calculations.js';
export { getProjectionStartingPatrimony } from './projectionBuckets.js';

/**
 * Builds the monthly table from settings + Balance data (multi-bucket).
 */
export function buildMonthlyProjectionTable({
  settings,
  contributionPlans = [],
  contributionEntries = [],
  annualExpenses = [],
  cashflowHistory = [],
  salaryHistory = [],
  assets = [],
  liabilities = [],
  snapshots = [],
  initialPatrimony,
  startDate,
  years,
}) {
  const resolvedInitial =
    initialPatrimony ??
    getProjectionStartingPatrimony({
      settings,
      assets,
      liabilities,
      snapshots,
    });

  return buildMonthlyProjectionRows({
    settings,
    contributionPlans,
    contributionEntries,
    annualExpenses,
    cashflowHistory,
    salaryHistory,
    assets,
    liabilities,
    snapshots,
    initialPatrimony: resolvedInitial,
    startDate,
    years,
  });
}

/** @deprecated Use summarizeProjectionRows */
export function summarizeMonthlyProjection(rows, initialPatrimony = 0) {
  const summary = summarizeProjectionRows(rows, initialPatrimony);
  return {
    ...summary,
    totalContributions: summary.totalNetContributed,
    totalInterest: summary.totalReturnGenerated,
    totalInvestment: rows.reduce((s, r) => s + r.additionalInvestments, 0),
    weightedAnnualReturn: rows[0]?.appliedWeightedReturn ?? 0,
  };
}
