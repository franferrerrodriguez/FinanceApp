import { useMemo } from 'react';
import { computeFinancialDiagnosis } from '../lib/financialDiagnosis';
import { useFinanceData } from '../store/hooks';

export function useFinancialDiagnosis() {
  const {
    settings,
    snapshots,
    assets,
    liabilities,
    annualExpenses,
    contributionPlans,
    contributionEntries,
    cashflowHistory,
  } = useFinanceData();

  return useMemo(
    () =>
      computeFinancialDiagnosis({
        settings,
        snapshots,
        assets,
        liabilities,
        annualExpenses,
        contributionPlans,
        contributionEntries,
        cashflowHistory,
      }),
    [
      settings,
      snapshots,
      assets,
      liabilities,
      annualExpenses,
      contributionPlans,
      contributionEntries,
      cashflowHistory,
    ],
  );
}
