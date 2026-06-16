import { BALANCE_TAB, balancePath } from './balanceTabs.js';
import {
  buildProjectionTable,
  calcFIREYear,
  calcTotalIncome,
  getEffectiveBudgetInvestment,
} from './calculations.js';
import { computeEmergencyFundMetrics, calcMonthlyExpenseBaseline } from './emergencyFund.js';
import { getCurrentMonthKey } from './dashboardMetrics.js';
import { getProjectionAnnualRate } from './projectionRates.js';
import { getProjectionStartingPatrimony } from './projectionBuckets.js';
import { computeGainLossBreakdown } from './monthlyCloseForm.js';
import { getSnapshotAssetId, groupSnapshotsByMonth } from './snapshotUtils.js';
import { getLiquidCashFromSnapshots } from './emergencyFund.js';

const STATUS = {
  OK: 'ok',
  WARN: 'warn',
  OPPORTUNITY: 'opportunity',
};

const STATUS_PRIORITY = { warn: 0, opportunity: 1, ok: 2 };

function diag({ id, status, titleKey, bodyKey, params = {}, actionHref, actionKey }) {
  return { id, status, titleKey, bodyKey, params, actionHref, actionKey };
}

function getLatestSnapshotAgeDays(snapshots, now = new Date()) {
  let latest = '';
  for (const snap of snapshots ?? []) {
    const d = String(snap.snapshotDate ?? '').slice(0, 10);
    if (d && d > latest) latest = d;
  }
  if (!latest) return null;
  const then = new Date(latest);
  const diffMs = now.getTime() - then.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function hasInvestmentAssets(assets = []) {
  return assets.some(
    (a) =>
      a.isActive !== false &&
      ['investment', 'etf', 'pension'].includes(a.category),
  );
}

function computeObservedPortfolioReturn(snapshots, assets, monthKey = getCurrentMonthKey()) {
  const monthSnaps = groupSnapshotsByMonth(snapshots)[monthKey] ?? [];
  const assetMap = Object.fromEntries((assets ?? []).map((a) => [a.id, a]));
  let totalGain = 0;
  let totalContributed = 0;
  let count = 0;

  for (const snap of monthSnaps) {
    const assetId = getSnapshotAssetId(snap);
    if (!assetId) continue;
    const asset = assetMap[assetId];
    if (!asset?.tracksGainLoss) continue;
    const gainLoss = snap.gainLossEuros;
    if (gainLoss == null || !Number.isFinite(Number(gainLoss))) continue;
    const breakdown = computeGainLossBreakdown(snap.value, gainLoss);
    if (!breakdown || breakdown.contributed <= 0) continue;
    totalGain += breakdown.gain;
    totalContributed += breakdown.contributed;
    count++;
  }

  if (count === 0 || totalContributed <= 0) return null;
  return totalGain / totalContributed;
}

function computeFireHorizon({
  settings,
  snapshots,
  assets,
  liabilities,
  annualExpenses,
}) {
  const patrimony = getProjectionStartingPatrimony({
    settings,
    assets,
    liabilities,
    snapshots,
  });
  const monthlyContrib = getEffectiveBudgetInvestment(settings);
  if (patrimony <= 0 || monthlyContrib <= 0) return null;

  const annualRate = getProjectionAnnualRate(settings);
  const monthlyExpenses = calcMonthlyExpenseBaseline(settings, annualExpenses);
  const annualExpensesTotal = monthlyExpenses * 12;

  const table = buildProjectionTable({
    initialPatrimony: patrimony,
    monthlyContrib,
    annualRate,
    years: 50,
    annualSalaryIncrease: settings?.annualSalaryIncrease ?? 0,
  });

  const fireYear = calcFIREYear(table, annualExpensesTotal, annualRate);
  if (fireYear != null) {
    const row = table.find((r) => r.year === fireYear);
    const monthlyIncome = row ? (row.patrimonioFin * annualRate) / 12 : 0;
    const currentYear = new Date().getFullYear();
    return {
      reachable: true,
      years: fireYear,
      targetYear: currentYear + fireYear,
      monthlyPassiveIncome: Math.round(monthlyIncome),
    };
  }

  for (let extra = 50; extra <= 500; extra += 50) {
    const altTable = buildProjectionTable({
      initialPatrimony: patrimony,
      monthlyContrib: monthlyContrib + extra,
      annualRate,
      years: 30,
    });
    const altYear = calcFIREYear(altTable, annualExpensesTotal, annualRate);
    if (altYear != null) {
      return { reachable: false, extraNeeded: extra, yearsAtExtra: altYear };
    }
  }

  return { reachable: false, extraNeeded: null };
}

function computeInvestmentRateYearsSaved(
  { settings, assets, liabilities, snapshots, annualExpenses: annualExpensesArr },
  currentRate,
  targetRate = 0.2,
) {
  if (currentRate >= targetRate) return null;
  // Use real patrimony from snapshots (same source as the FIRE projection page)
  const patrimony = getProjectionStartingPatrimony({ settings, assets, liabilities, snapshots });
  const income = calcTotalIncome(settings);
  const currentContrib = getEffectiveBudgetInvestment(settings);
  const targetContrib = income * targetRate;
  const annualRate = getProjectionAnnualRate(settings);
  // Use same expense baseline as FIRE projection (reads cashflow history if available)
  const annualExpenses = calcMonthlyExpenseBaseline(settings, annualExpensesArr) * 12;
  if (annualExpenses <= 0) return null;

  const tableCurrent = buildProjectionTable({
    initialPatrimony: patrimony,
    monthlyContrib: currentContrib,
    annualRate,
    years: 50,
  });
  const tableTarget = buildProjectionTable({
    initialPatrimony: patrimony,
    monthlyContrib: targetContrib,
    annualRate,
    years: 50,
  });

  const fireCurrent = calcFIREYear(tableCurrent, annualExpenses, annualRate);
  const fireTarget = calcFIREYear(tableTarget, annualExpenses, annualRate);
  if (fireCurrent == null || fireTarget == null) return null;
  return Math.max(0, fireCurrent - fireTarget);
}

export function computeDiagnostics({
  settings,
  snapshots = [],
  assets = [],
  liabilities = [],
  annualExpenses = [],
}) {
  const results = [];
  if (!settings) return results;

  const income = calcTotalIncome(settings);
  const emergencyFund = computeEmergencyFundMetrics({
    settings,
    snapshots,
    assets,
    annualExpenses,
  });

  if (emergencyFund.hasLiquidData && emergencyFund.monthlyExpenses > 0) {
    const months = emergencyFund.monthsCovered;
    if (months >= 6) {
      results.push(
        diag({
          id: 'emergency_fund',
          status: STATUS.OK,
          titleKey: 'diagnostics.emergencyFund.ok.title',
          bodyKey: 'diagnostics.emergencyFund.ok.body',
          params: { months: Math.round(months * 10) / 10 },
          actionHref: balancePath(BALANCE_TAB.CASHFLOW),
          actionKey: 'diagnostics.emergencyFund.action',
        }),
      );
    } else if (months >= 3) {
      results.push(
        diag({
          id: 'emergency_fund',
          status: STATUS.WARN,
          titleKey: 'diagnostics.emergencyFund.mid.title',
          bodyKey: 'diagnostics.emergencyFund.mid.body',
          params: { months: Math.round(months * 10) / 10 },
          actionHref: balancePath(BALANCE_TAB.PATRIMONY),
          actionKey: 'diagnostics.emergencyFund.action',
        }),
      );
    } else {
      results.push(
        diag({
          id: 'emergency_fund',
          status: STATUS.WARN,
          titleKey: 'diagnostics.emergencyFund.low.title',
          bodyKey: 'diagnostics.emergencyFund.low.body',
          params: { months: Math.round(months * 10) / 10 },
          actionHref: balancePath(BALANCE_TAB.PATRIMONY),
          actionKey: 'diagnostics.emergencyFund.action',
        }),
      );
    }
  }

  if (income > 0) {
    const investment = getEffectiveBudgetInvestment(settings);
    const rate = investment / income;
    if (rate >= 0.2) {
      results.push(
        diag({
          id: 'investment_rate',
          status: STATUS.OK,
          titleKey: 'diagnostics.investmentRate.ok.title',
          bodyKey: 'diagnostics.investmentRate.ok.body',
          params: { rate },
          actionHref: balancePath(BALANCE_TAB.CASHFLOW),
          actionKey: 'diagnostics.investmentRate.action',
        }),
      );
    } else if (rate >= 0.1) {
      const yearsSavedRaw = computeInvestmentRateYearsSaved(
        { settings, assets, liabilities, snapshots, annualExpenses },
        rate,
        0.2,
      );
      let bodyKey = 'diagnostics.investmentRate.mid.body';
      const params = { rate };
      if (yearsSavedRaw == null) {
        bodyKey = 'diagnostics.investmentRate.mid.unreachable';
      } else {
        const yearsSaved = Math.round(yearsSavedRaw);
        if (yearsSaved <= 0) {
          bodyKey = 'diagnostics.investmentRate.mid.lessThanOne';
        } else {
          params.yearsSaved = yearsSaved;
        }
      }
      results.push(
        diag({
          id: 'investment_rate',
          status: STATUS.OPPORTUNITY,
          titleKey: 'diagnostics.investmentRate.mid.title',
          bodyKey,
          params,
          actionHref: balancePath(BALANCE_TAB.CASHFLOW),
          actionKey: 'diagnostics.investmentRate.action',
        }),
      );
    } else {
      const targetContrib = income * 0.1;
      const gap = Math.max(0, targetContrib - investment);
      results.push(
        diag({
          id: 'investment_rate',
          status: STATUS.WARN,
          titleKey: 'diagnostics.investmentRate.low.title',
          bodyKey: 'diagnostics.investmentRate.low.body',
          params: { rate, gap: Math.round(gap) },
          actionHref: balancePath(BALANCE_TAB.CASHFLOW),
          actionKey: 'diagnostics.investmentRate.action',
        }),
      );
    }
  }

  const liquid = getLiquidCashFromSnapshots(snapshots, assets);
  const monthlyExpenses = emergencyFund.monthlyExpenses;
  if (
    monthlyExpenses > 0 &&
    liquid > monthlyExpenses * 12 &&
    hasInvestmentAssets(assets)
  ) {
    const monthsCovered = liquid / monthlyExpenses;
    const excess = Math.max(0, liquid - monthlyExpenses * 6);
    const savingsRate = settings?.savingsAccountReturn ?? 0.025;
    results.push(
      diag({
        id: 'excess_liquidity',
        status: STATUS.OPPORTUNITY,
        titleKey: 'diagnostics.excessLiquidity.title',
        bodyKey: 'diagnostics.excessLiquidity.body',
        params: {
          liquid,
          months: Math.round(monthsCovered * 10) / 10,
          excess: Math.round(excess),
          savingsRate,
          indexRate: getProjectionAnnualRate(settings),
        },
        actionHref: balancePath(BALANCE_TAB.PATRIMONY),
        actionKey: 'diagnostics.excessLiquidity.action',
      }),
    );
  }

  const highInterest = (liabilities ?? []).filter(
    (l) =>
      l.isActive !== false &&
      l.interestRate != null &&
      Number(l.interestRate) > 0.05,
  );
  for (const liability of highInterest) {
    const rate = Number(liability.interestRate);
    results.push(
      diag({
        id: `high_interest_${liability.id}`,
        status: STATUS.WARN,
        titleKey: 'diagnostics.highInterest.title',
        bodyKey: 'diagnostics.highInterest.body',
        params: { name: liability.name, rate },
        actionHref: balancePath(BALANCE_TAB.PATRIMONY),
        actionKey: 'diagnostics.highInterest.action',
      }),
    );
  }

  const snapshotAge = getLatestSnapshotAgeDays(snapshots);
  if (snapshotAge != null && snapshotAge > 35) {
    results.push(
      diag({
        id: 'stale_snapshots',
        status: STATUS.WARN,
        titleKey: 'diagnostics.staleSnapshots.title',
        bodyKey: 'diagnostics.staleSnapshots.body',
        params: { days: snapshotAge },
        actionHref: balancePath(BALANCE_TAB.PATRIMONY),
        actionKey: 'diagnostics.staleSnapshots.action',
      }),
    );
  }

  const observedReturn = computeObservedPortfolioReturn(snapshots, assets);
  if (observedReturn != null) {
    const estimated = getProjectionAnnualRate(settings);
    if (observedReturn < estimated - 0.005) {
      results.push(
        diag({
          id: 'portfolio_return',
          status: STATUS.OPPORTUNITY,
          titleKey: 'diagnostics.portfolioReturn.below.title',
          bodyKey: 'diagnostics.portfolioReturn.below.body',
          params: { real: observedReturn, estimated },
          actionHref: '/projection',
          actionKey: 'diagnostics.portfolioReturn.action',
        }),
      );
    } else {
      results.push(
        diag({
          id: 'portfolio_return',
          status: STATUS.OK,
          titleKey: 'diagnostics.portfolioReturn.above.title',
          bodyKey: 'diagnostics.portfolioReturn.above.body',
          params: { real: observedReturn, estimated },
          actionHref: '/projection',
          actionKey: 'diagnostics.portfolioReturn.action',
        }),
      );
    }
  }

  const fire = computeFireHorizon({
    settings,
    snapshots,
    assets,
    liabilities,
    annualExpenses,
  });
  if (fire?.reachable) {
    results.push(
      diag({
        id: 'fire_horizon',
        status: STATUS.OK,
        titleKey: 'diagnostics.fire.reachable.title',
        bodyKey: 'diagnostics.fire.reachable.body',
        params: {
          year: fire.targetYear,
          years: fire.years,
          monthlyIncome: fire.monthlyPassiveIncome,
        },
        actionHref: '/projection',
        actionKey: 'diagnostics.fire.action',
      }),
    );
  } else if (fire && !fire.reachable) {
    results.push(
      diag({
        id: 'fire_horizon',
        status: STATUS.OPPORTUNITY,
        titleKey: 'diagnostics.fire.unreachable.title',
        bodyKey: 'diagnostics.fire.unreachable.body',
        params: {
          extra: fire.extraNeeded,
          years: fire.yearsAtExtra ?? 30,
        },
        actionHref: balancePath(BALANCE_TAB.CASHFLOW),
        actionKey: 'diagnostics.fire.action',
      }),
    );
  }

  return results;
}

export function sortDiagnosticsByUrgency(items) {
  return [...items].sort(
    (a, b) => (STATUS_PRIORITY[a.status] ?? 9) - (STATUS_PRIORITY[b.status] ?? 9),
  );
}

export function groupDiagnosticsByStatus(items) {
  return {
    ok: items.filter((d) => d.status === STATUS.OK),
    warn: items.filter((d) => d.status === STATUS.WARN),
    opportunity: items.filter((d) => d.status === STATUS.OPPORTUNITY),
  };
}

export function getDiagnosticIcon(status) {
  if (status === STATUS.OK) return '✓';
  if (status === STATUS.WARN) return '⚠️';
  return '💡';
}

export { STATUS };
