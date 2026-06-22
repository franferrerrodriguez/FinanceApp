import { useTranslation } from 'react-i18next';
import { NotificationPermissionBanner } from '../../components/NotificationPermissionBanner';
import { SaveProgressBanner } from '../../components/SaveProgressBanner';
import { hasEstimatedFixedExpenses } from '../../lib/expenseEstimates';
import { ui } from '../../lib/uiClasses';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useFinanceAlerts } from '../../hooks/useFinanceAlerts';
import { useSettings } from '../../store/hooks';
import { AssetDonutChart } from './components/AssetDonutChart';
import { LiabilityDonutChart } from './components/LiabilityDonutChart';
import { CashflowChart } from './components/CashflowChart';
import { DashboardAlerts } from './components/DashboardAlerts';
import { AnnualExpensesSummaryLine } from '../../components/AnnualExpensesSection';
import { EmergencyFundCard } from './components/EmergencyFundCard';
import { KpiGrid } from './components/KpiGrid';
import { EcbDepositRateCard } from './components/EcbDepositRateCard';
import { EcbEuriborCard } from './components/EcbEuriborCard';
import { IneCoreInflationCard } from './components/IneCoreInflationCard';
import { IneInflationCard } from './components/IneInflationCard';
import { NetWorthChart } from './components/NetWorthChart';
import { TopHoldingsTable } from './components/TopHoldingsTable';
import { DiagnosticCard } from '../diagnostics/DiagnosticoPage';

export function DashboardPage() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const data = useDashboardData();
  const { alerts, hasPendingTasks } = useFinanceAlerts();
  const usesEstimates = hasEstimatedFixedExpenses(settings);
  const showAlerts = hasPendingTasks || alerts.length > 0;

  return (
    <div className={ui.stackPage}>
      <SaveProgressBanner />
      <NotificationPermissionBanner />

      {showAlerts ? <DashboardAlerts /> : null}

      {usesEstimates ? (
        <p className={`text-sm ${ui.textMuted}`}>
          {t('dashboard.subtitleWithEstimates')}
        </p>
      ) : null}

      <KpiGrid kpis={data} />

      <EmergencyFundCard emergencyFund={data.emergencyFund} />

      <DiagnosticCard />

      <CashflowChart
        segments={data.cashflowSegments}
        income={data.income}
      />

      <AnnualExpensesSummaryLine
        yearlyTotal={data.annualExpensesYearly}
        monthlyAvg={data.annualExpensesMonthlyAvg}
      />

      <NetWorthChart history={data.history} />

      <section className="space-y-4">
        <h2 className={`text-sm font-semibold uppercase tracking-wider ${ui.textMuted}`}>
          {t('dashboard.detailSection')}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <AssetDonutChart distribution={data.assetDistribution} />
          <LiabilityDonutChart distribution={data.liabilityDistribution} />
        </div>
        <TopHoldingsTable
          topAssets={data.topHoldings.topAssets}
          topLiabilities={data.topHoldings.topLiabilities}
        />
      </section>

      <section className="space-y-4">
        <h2 className={`text-sm font-semibold uppercase tracking-wider ${ui.textMuted}`}>
          {t('dashboard.macroSection')}
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <IneInflationCard />
          <IneCoreInflationCard />
          <EcbEuriborCard />
          <EcbDepositRateCard />
        </div>
      </section>
    </div>
  );
}
