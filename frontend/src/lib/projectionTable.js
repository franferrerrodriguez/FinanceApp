import {
  buildMonthlyProjectionRows,
  summarizeProjectionRows,
} from './calculations.js';
import { resolveInvestmentContributionsForMonth } from './contributionPlans.js';
import { getProjectionAnnualRate } from './projectionRates.js';

export { getProjectionAnnualRate } from './projectionRates.js';
export {
  annualToMonthlyRate,
  buildMonthlyProjectionRows,
  summarizeProjectionRows,
} from './calculations.js';

/**
 * Construye la tabla mensual leyendo settings + aportaciones de Patrimonio.
 */
export function buildMonthlyProjectionTable({
  settings,
  contributionPlans = [],
  annualExpenses = [],
  salaryHistory = [],
  initialPatrimony,
  startDate,
  years,
}) {
  const annualRate = getProjectionAnnualRate(settings);

  return buildMonthlyProjectionRows({
    settings,
    contributionPlans,
    annualExpenses,
    salaryHistory,
    initialPatrimony,
    startDate,
    years,
    annualRate,
    getInvestmentContributions: resolveInvestmentContributionsForMonth,
  });
}

/** @deprecated Usa summarizeProjectionRows */
export function summarizeMonthlyProjection(rows, initialPatrimony = 0) {
  const summary = summarizeProjectionRows(rows, initialPatrimony);
  return {
    ...summary,
    totalContributions: summary.totalNetContributed,
    totalInterest: summary.totalReturnGenerated,
    totalInvestment: rows.reduce((s, r) => s + r.additionalInvestments, 0),
  };
}
