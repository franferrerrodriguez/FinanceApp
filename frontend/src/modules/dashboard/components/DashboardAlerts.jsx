import { useTranslation } from 'react-i18next';
import { FinanceAlerts } from '../../../components/FinanceAlerts';
import { FinancePendingTasks } from '../../../components/FinancePendingTasks';
import { useFinanceAlerts } from '../../../hooks/useFinanceAlerts';
import { ui } from '../../../lib/uiClasses';

export function DashboardAlerts() {
  const { t } = useTranslation();
  const {
    alerts,
    setupSteps,
    pendingSteps,
    setupCompleteCount,
    setupTotalSteps,
    setupNextStepId,
  } = useFinanceAlerts();

  if (pendingSteps.length === 0 && alerts.length === 0) return null;

  return (
    <div className={`${ui.chartCard} space-y-4`}>
      {pendingSteps.length > 0 ? (
        <FinancePendingTasks
          steps={setupSteps}
          completeCount={setupCompleteCount}
          totalSteps={setupTotalSteps}
          nextStepId={setupNextStepId}
        />
      ) : null}
      {alerts.length > 0 ? (
        <FinanceAlerts
          alerts={alerts}
          title={
            pendingSteps.length > 0 ? t('alerts.noticesTitle') : t('dashboard.alertsTitle')
          }
        />
      ) : null}
    </div>
  );
}
