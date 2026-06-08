import { useMemo } from 'react';
import { computeFinanceNotifications } from '../lib/notifications';
import { useFinanceData, usePreferences } from '../store/hooks';

/** Finance notifications, alerts and setup progress shared across pages. */
export function useFinanceAlerts() {
  const { locale } = usePreferences();
  const {
    settings,
    snapshots,
    assets,
    liabilities,
    annualExpenses,
    contributionEntries,
  } = useFinanceData();

  return useMemo(() => {
    const notifications = computeFinanceNotifications({
      settings,
      snapshots,
      assets,
      liabilities,
      annualExpenses,
      contributionEntries,
      locale,
    });

    const { setup } = notifications;

    return {
      ...notifications,
      setupSteps: setup.steps,
      pendingSteps: setup.pendingSteps,
      setupCompleteCount: setup.completeCount,
      setupTotalSteps: setup.totalSteps,
      setupNextStepId: setup.nextStepId,
      hasPendingTasks: setup.hasPending,
      notificationCount: notifications.badgeCount,
    };
  }, [
    settings,
    snapshots,
    assets,
    liabilities,
    annualExpenses,
    contributionEntries,
    locale,
  ]);
}
