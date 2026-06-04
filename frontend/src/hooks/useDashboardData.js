import { useMemo } from 'react';
import { computeDashboardKpis } from '../lib/dashboardMetrics';
import { useFinanceData } from '../store/hooks';

export function useDashboardData() {
  const { settings, snapshots, assets, liabilities, annualExpenses } =
    useFinanceData();

  return useMemo(
    () =>
      computeDashboardKpis({
        settings,
        snapshots,
        assets,
        liabilities,
        annualExpenses,
      }),
    [settings, snapshots, assets, liabilities, annualExpenses],
  );
}
