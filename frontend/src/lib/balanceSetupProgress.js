import {
  calcFreeCashflow,
  calcTotalFixedExpenses,
  calcTotalIncome,
  calcTotalVariableExpenses,
} from './calculations.js';
import { hasInvestmentDestinationAssets } from './contributionPlans.js';
import { hasContributionEntries } from './contributionEntries.js';
import { hasActiveLiquidAssets } from './emergencyFund.js';
import { hasPatrimonyAccounts } from './monthlyClose.js';
import { getCurrentPatrimonySummary } from './patrimony.js';

export const BALANCE_SETUP_STEP = {
  ACCOUNTS: 'accounts',
  LIQUID: 'liquid',
  INVEST: 'invest',
};

/** User has saved at least one balance for the current month. */
export function hasRecordedAccountBalances(snapshots) {
  return getCurrentPatrimonySummary(snapshots).hasClose;
}

export function needsAccountBalancesSetup(assets, liabilities, snapshots) {
  if (!hasPatrimonyAccounts(assets, liabilities)) return true;
  return !hasRecordedAccountBalances(snapshots);
}

/** Bank or cash account needed to measure the emergency fund. */
export function needsLiquidAccountsSetup(assets, liabilities, snapshots) {
  if (needsAccountBalancesSetup(assets, liabilities, snapshots)) return false;
  return !hasActiveLiquidAssets(assets);
}

/** Optional: funds/ETF/pension exist but no real contribution logged yet. */
export function needsContributionsSetup(assets, contributionEntries) {
  if (!hasInvestmentDestinationAssets(assets)) return false;
  return !hasContributionEntries(contributionEntries);
}

const SETUP_STEP_ORDER = [
  BALANCE_SETUP_STEP.ACCOUNTS,
  BALANCE_SETUP_STEP.LIQUID,
  BALANCE_SETUP_STEP.INVEST,
];

export function getBalanceSetupSteps({
  assets = [],
  liabilities = [],
  snapshots = [],
  contributionEntries = [],
}) {
  const accountsComplete = !needsAccountBalancesSetup(
    assets,
    liabilities,
    snapshots,
  );
  const liquidComplete =
    accountsComplete &&
    !needsLiquidAccountsSetup(assets, liabilities, snapshots);
  const steps = [
    {
      id: BALANCE_SETUP_STEP.ACCOUNTS,
      optional: false,
      complete: accountsComplete,
    },
    {
      id: BALANCE_SETUP_STEP.LIQUID,
      optional: false,
      complete: liquidComplete,
    },
  ];

  if (hasInvestmentDestinationAssets(assets)) {
    steps.push({
      id: BALANCE_SETUP_STEP.INVEST,
      optional: true,
      complete: hasContributionEntries(contributionEntries),
    });
  }

  const completeCount = steps.filter((step) => step.complete).length;
  const pendingSteps = steps.filter((step) => !step.complete);

  return {
    steps,
    pendingSteps,
    completeCount,
    totalSteps: steps.length,
    allComplete: completeCount === steps.length,
    hasPending: pendingSteps.length > 0,
    nextStepId: pendingSteps[0]?.id ?? null,
  };
}

/** @deprecated Use getBalanceSetupSteps */
export function getBalanceSetupPendingSteps(data) {
  const { pendingSteps, hasPending, nextStepId } = getBalanceSetupSteps(data);
  return { pendingSteps, hasPending, nextStepId };
}

/** Hide emergency-fund setup alerts when the pending list already covers them. */
export function filterFinanceAlerts(alerts, pendingSteps = []) {
  const coversEmergencySetup = pendingSteps.some(
    (step) =>
      step.id === BALANCE_SETUP_STEP.ACCOUNTS ||
      step.id === BALANCE_SETUP_STEP.LIQUID,
  );

  if (!coversEmergencySetup) return alerts;

  return alerts.filter(
    (alert) =>
      alert.id !== 'emergency_fund_no_accounts' &&
      alert.id !== 'emergency_fund_no_balances',
  );
}

/** Monthly savings after fixed and variable expenses (no plan split). */
export function calcMonthlySavingsFromSettings(settings) {
  const income = calcTotalIncome(settings);
  const fixed = calcTotalFixedExpenses(settings);
  const variable = calcTotalVariableExpenses(settings);
  return calcFreeCashflow(income, fixed, 0, variable);
}
