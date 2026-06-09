import { balancePath } from './balanceTabs.js';
import {
  calcCoreFixedExpenses,
  calcTotalIncome,
  calcTotalVariableExpenses,
  getEffectiveBudgetInvestment,
} from './calculations.js';
import { getAnnualExpensesMonthlyAverage } from './annualExpenses.js';
import { normalizeProjectionYears } from './constants.js';
import { computeEmergencyFundMetrics } from './emergencyFund.js';
import { balanceClosePath, getMonthlyCloseStatus } from './monthlyClose.js';
import { buildMonthlyProjectionTable } from './projectionTable.js';
import { normalizeEuros } from './money.js';

/** Reference investment rate used in copy ("above average"). */
export const INVESTMENT_RATE_BENCHMARK = 0.15;

/** Minimum excess liquidity (€) before suggesting a move to investments. */
export const EXCESS_LIQUIDITY_MIN_EUR = 500;

const TONE_PRIORITY = {
  warn: 0,
  tip: 1,
  info: 2,
  positive: 3,
};

/**
 * @typedef {Object} DiagnosisInsight
 * @property {string} id
 * @property {'positive'|'info'|'warn'|'tip'} tone
 * @property {Record<string, unknown>} [params]
 * @property {string} [href]
 * @property {string} [actionKey]
 */

export function estimateFireYearsFromProjection(rows, annualLivingExpenses) {
  if (!rows?.length || annualLivingExpenses <= 0) return null;

  for (const row of rows) {
    const rate = row.appliedWeightedReturn ?? row.appliedAnnualRate ?? 0;
    if (rate <= 0) continue;
    const annualReturn = row.patrimonyEnd * rate;
    if (annualReturn >= annualLivingExpenses) {
      return Math.max(1, Math.ceil((row.monthIndex + 1) / 12));
    }
  }

  return null;
}

function calcAnnualLivingExpenses(settings, annualExpenses = []) {
  const monthly =
    calcCoreFixedExpenses(settings) +
    calcTotalVariableExpenses(settings) +
    getAnnualExpensesMonthlyAverage(annualExpenses);
  return normalizeEuros(monthly * 12);
}

function pushInsight(list, insight) {
  if (!insight) return;
  list.push(insight);
}

function sortInsights(insights) {
  return [...insights].sort(
    (a, b) => (TONE_PRIORITY[a.tone] ?? 9) - (TONE_PRIORITY[b.tone] ?? 9),
  );
}

/**
 * Personalized financial diagnosis from real user data.
 * @returns {{ insights: DiagnosisInsight[] }}
 */
export function computeFinancialDiagnosis({
  settings,
  snapshots = [],
  assets = [],
  liabilities = [],
  annualExpenses = [],
  contributionPlans = [],
  contributionEntries = [],
  cashflowHistory = [],
  now = new Date(),
  maxItems = 4,
}) {
  const insights = [];

  const income = calcTotalIncome(settings);
  const monthlyInvestment = getEffectiveBudgetInvestment(settings);
  const investmentRate = income > 0 ? monthlyInvestment / income : 0;

  const emergencyFund = computeEmergencyFundMetrics({
    settings,
    snapshots,
    assets,
    annualExpenses,
  });

  const monthlyClose = getMonthlyCloseStatus(snapshots, assets, liabilities, { now });
  const pendingCount = monthlyClose.pendingMonths?.length ?? 0;

  if (pendingCount >= 2) {
    pushInsight(insights, {
      id: 'stale_balances',
      tone: 'warn',
      params: { count: pendingCount },
      href: balanceClosePath(monthlyClose.suggestedMonthKey),
      actionKey: 'dashboard.diagnosis.actionUpdateBalances',
    });
  }

  if (
    emergencyFund.hasLiquidData &&
    emergencyFund.targetAmount > 0 &&
    emergencyFund.liquid >= emergencyFund.targetAmount
  ) {
    const excess = normalizeEuros(emergencyFund.liquid - emergencyFund.targetAmount);
    if (excess >= EXCESS_LIQUIDITY_MIN_EUR) {
      pushInsight(insights, {
        id: 'emergency_fund_excess',
        tone: 'positive',
        params: { amount: excess },
        href: balancePath('patrimony'),
        actionKey: 'dashboard.diagnosis.actionReviewPatrimony',
      });
    } else {
      pushInsight(insights, {
        id: 'emergency_fund_covered',
        tone: 'positive',
        params: {
          months: Math.round(emergencyFund.monthsCovered * 10) / 10,
        },
      });
    }
  } else if (
    emergencyFund.hasLiquidData &&
    emergencyFund.targetAmount > 0 &&
    emergencyFund.shortfall > 0
  ) {
    pushInsight(insights, {
      id: 'emergency_fund_gap',
      tone: emergencyFund.status === 'danger' ? 'warn' : 'tip',
      params: {
        shortfall: emergencyFund.shortfall,
        monthsCovered: formatMonthsCovered(emergencyFund.monthsCovered),
        monthsTarget: emergencyFund.monthsTarget,
      },
      href: balancePath('patrimony'),
      actionKey: 'dashboard.diagnosis.actionReviewPatrimony',
    });
  }

  if (income > 0 && investmentRate >= 0.08) {
    const projectionYears = normalizeProjectionYears(settings?.projectionYears);
    const rows = buildMonthlyProjectionTable({
      settings,
      contributionPlans,
      contributionEntries,
      annualExpenses,
      cashflowHistory,
      assets,
      liabilities,
      snapshots,
      years: projectionYears,
    });
    const annualLiving = calcAnnualLivingExpenses(settings, annualExpenses);
    const fireYears = estimateFireYearsFromProjection(rows, annualLiving);

    if (fireYears != null) {
      const aboveBenchmark = investmentRate >= INVESTMENT_RATE_BENCHMARK;
      pushInsight(insights, {
        id: aboveBenchmark ? 'investment_rate_strong' : 'investment_rate_fire',
        tone: aboveBenchmark ? 'positive' : 'info',
        params: {
          rate: roundPercent(investmentRate),
          years: fireYears,
          benchmark: roundPercent(INVESTMENT_RATE_BENCHMARK),
        },
        href: '/projection',
        actionKey: 'dashboard.diagnosis.actionViewProjection',
      });
    }
  } else if (income > 0 && investmentRate > 0 && investmentRate < 0.08) {
    const savingsRate =
      income > 0
        ? Math.max(
            0,
            (income -
              calcCoreFixedExpenses(settings) -
              calcTotalVariableExpenses(settings) -
              monthlyInvestment) /
              income,
          )
        : 0;
    if (savingsRate >= 0.15) {
      pushInsight(insights, {
        id: 'low_investment_high_savings',
        tone: 'tip',
        params: {
          savingsRate: roundPercent(savingsRate),
          investmentRate: roundPercent(investmentRate),
        },
        href: balancePath('cashflow'),
        actionKey: 'dashboard.diagnosis.actionReviewBudget',
      });
    }
  }

  return {
    insights: sortInsights(insights).slice(0, maxItems),
  };
}

function roundPercent(rate) {
  return Math.round(rate * 1000) / 10;
}

function formatMonthsCovered(value) {
  if (!Number.isFinite(value)) return '0';
  if (value >= 99) return '99+';
  return String(Math.round(value * 10) / 10).replace(/\.0$/, '');
}
