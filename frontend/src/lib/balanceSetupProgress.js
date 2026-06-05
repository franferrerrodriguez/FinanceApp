import {
  calcFreeCashflow,
  calcTotalFixedExpenses,
  calcTotalIncome,
  calcTotalVariableExpenses,
} from './calculations.js';
import { hasActiveContributionAmounts } from './contributionPlans.js';
import { filterDraftAssets } from './patrimonyDrafts.js';
import { getCurrentPatrimonySummary } from './patrimony.js';

export const BALANCE_SETUP_STEP = {
  ACCOUNTS: 'accounts',
  CASHFLOW: 'cashflow',
  INVEST: 'invest',
};

/** User has saved at least one balance for the current month. */
export function hasRecordedAccountBalances(snapshots) {
  return getCurrentPatrimonySummary(snapshots).hasClose;
}

/** Income and expenses are set (typical after onboarding). */
export function hasMonthlySavingsConfigured(settings) {
  return calcTotalIncome(settings) > 0;
}

/**
 * Step 3 done when there is nothing to allocate (only bank/cash)
 * or the user set monthly amounts to funds/pension.
 */
/** Optional step: done once you have accounts, or when a plan line has amounts. */
export function isInvestStepComplete(assets, contributionPlans) {
  const active = filterDraftAssets(assets).filter((a) => a.isActive !== false);
  if (!active.length) return false;
  if (hasActiveContributionAmounts(contributionPlans)) return true;
  return active.length > 0;
}

export function getBalanceSetupProgress({
  settings,
  assets = [],
  snapshots = [],
  contributionPlans = [],
}) {
  const steps = [
    {
      id: BALANCE_SETUP_STEP.ACCOUNTS,
      complete: hasRecordedAccountBalances(snapshots),
    },
    {
      id: BALANCE_SETUP_STEP.CASHFLOW,
      complete: hasMonthlySavingsConfigured(settings),
    },
    {
      id: BALANCE_SETUP_STEP.INVEST,
      complete: isInvestStepComplete(assets, contributionPlans),
    },
  ];

  const completeCount = steps.filter((s) => s.complete).length;

  return {
    steps,
    completeCount,
    allComplete: completeCount === steps.length,
    nextStepId: steps.find((s) => !s.complete)?.id ?? null,
  };
}

/** Monthly savings after fixed and variable expenses (no plan split). */
export function calcMonthlySavingsFromSettings(settings) {
  const income = calcTotalIncome(settings);
  const fixed = calcTotalFixedExpenses(settings);
  const variable = calcTotalVariableExpenses(settings);
  return calcFreeCashflow(income, fixed, 0, variable);
}
