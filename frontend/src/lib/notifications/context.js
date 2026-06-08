import { getBalanceSetupSteps, filterFinanceAlerts } from '../balanceSetupProgress.js';
import { computeDashboardKpis } from '../dashboardMetrics.js';

/** Shared snapshot of finance state for all notification sources. */
export function buildNotificationContext({
  settings,
  snapshots = [],
  assets = [],
  liabilities = [],
  annualExpenses = [],
  contributionEntries = [],
  locale = 'es',
}) {
  const setup = getBalanceSetupSteps({
    assets,
    liabilities,
    snapshots,
    contributionEntries,
  });

  const kpis = computeDashboardKpis({
    settings,
    snapshots,
    assets,
    liabilities,
    annualExpenses,
    locale,
  });

  const alerts = filterFinanceAlerts(kpis.alerts, setup.pendingSteps);

  return {
    settings,
    snapshots,
    assets,
    liabilities,
    annualExpenses,
    contributionEntries,
    locale,
    setup,
    alerts,
    emergencyFund: kpis.emergencyFund,
    monthlyClose: kpis.monthlyClose,
    kpis,
  };
}
