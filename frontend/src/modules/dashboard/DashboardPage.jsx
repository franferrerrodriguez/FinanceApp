import { useTranslation } from 'react-i18next';
import { SaveProgressBanner } from '../../components/SaveProgressBanner';
import { hasEstimatedFixedExpenses } from '../../lib/expenseEstimates';
import { ui } from '../../lib/uiClasses';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useSettings } from '../../store/hooks';
import { AssetDonutChart } from './components/AssetDonutChart';
import { CashflowChart } from './components/CashflowChart';
import { DashboardAlerts } from './components/DashboardAlerts';
import { AnnualExpensesSummaryLine } from '../../components/AnnualExpensesSection';
import { EmergencyFundCard } from './components/EmergencyFundCard';
import { KpiGrid } from './components/KpiGrid';
import { NetWorthChart } from './components/NetWorthChart';
import { TopHoldingsTable } from './components/TopHoldingsTable';

export function DashboardPage() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const data = useDashboardData();
  const usesEstimates = hasEstimatedFixedExpenses(settings);

  return (
    <div className="space-y-6">
      <SaveProgressBanner />

      {usesEstimates ? (
        <p className={`text-sm ${ui.textMuted}`}>
          {t('dashboard.subtitleWithEstimates')}
        </p>
      ) : null}

      <KpiGrid kpis={data} />

      <AnnualExpensesSummaryLine
        yearlyTotal={data.annualExpensesYearly}
        monthlyAvg={data.annualExpensesMonthlyAvg}
      />

      <EmergencyFundCard emergencyFund={data.emergencyFund} />

      {data.alerts.length > 0 ? <DashboardAlerts alerts={data.alerts} /> : null}

      <NetWorthChart history={data.history} />

      <CashflowChart
        segments={data.cashflowSegments}
        income={data.income}
      />

      <section className="space-y-4">
        <h2 className={`text-sm font-semibold uppercase tracking-wider ${ui.textMuted}`}>
          {t('dashboard.detailSection')}
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <AssetDonutChart distribution={data.assetDistribution} />
          <TopHoldingsTable
            topAssets={data.topHoldings.topAssets}
            topLiabilities={data.topHoldings.topLiabilities}
          />
        </div>
      </section>
    </div>
  );
}
