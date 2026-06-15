import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FinanceAlerts } from '../../../components/FinanceAlerts';
import { FinancePendingTasks } from '../../../components/FinancePendingTasks';
import { useFinanceAlerts } from '../../../hooks/useFinanceAlerts';
import { BALANCE_SETUP_STEP } from '../../../lib/balanceSetupProgress';
import { BALANCE_TAB, balancePath } from '../../../lib/balanceTabs';
import { ui } from '../../../lib/uiClasses';

export function DashboardAlerts() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    alerts,
    setupSteps,
    pendingSteps,
    setupCompleteCount,
    setupTotalSteps,
    setupNextStepId,
  } = useFinanceAlerts();

  if (pendingSteps.length === 0 && alerts.length === 0) return null;

  const handleStepAction = (stepId) => {
    const path = balancePath(BALANCE_TAB.PATRIMONY);
    if (stepId === BALANCE_SETUP_STEP.ACCOUNTS) {
      navigate(path, { state: { openRecordBalances: true } });
    } else {
      navigate(path, { state: { openAddAsset: true } });
    }
  };

  // Show only the single next pending step to avoid overwhelming the user
  const nextStep = setupSteps.find((s) => s.id === setupNextStepId);
  const nextStepList = nextStep ? [nextStep] : [];

  return (
    <div className={`${ui.chartCard} space-y-4`}>
      {nextStepList.length > 0 ? (
        <FinancePendingTasks
          steps={nextStepList}
          completeCount={setupCompleteCount}
          totalSteps={setupTotalSteps}
          nextStepId={setupNextStepId}
          onStepAction={handleStepAction}
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
