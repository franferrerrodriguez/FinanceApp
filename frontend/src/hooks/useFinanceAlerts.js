import { useMemo } from 'react';
import { computeDashboardKpis } from '../lib/dashboardMetrics';
import { useFinanceData, usePreferences } from '../store/hooks';

/** Cashflow, emergency fund and patrimony alerts shared across pages. */
export function useFinanceAlerts() {
  const { locale } = usePreferences();
  const { settings, snapshots, assets, liabilities, annualExpenses } =
    useFinanceData();

  return useMemo(() => {
    const { alerts, emergencyFund, monthlyClose } = computeDashboardKpis({
      settings,
      snapshots,
      assets,
      liabilities,
      annualExpenses,
      locale,
    });
    return { alerts, emergencyFund, monthlyClose };
  }, [settings, snapshots, assets, liabilities, annualExpenses, locale]);
}
