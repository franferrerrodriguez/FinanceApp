import { NOTIFICATION_SOURCE } from '../types.js';

/** KPI / emergency fund / monthly close alerts from dashboard metrics. */
export const financeAlertsNotificationSource = {
  id: NOTIFICATION_SOURCE.FINANCE_ALERT,
  collect(ctx) {
    return (ctx.alerts ?? []).map((alert) => ({
      id: alert.id,
      source: NOTIFICATION_SOURCE.FINANCE_ALERT,
      severity: alert.severity ?? 'warn',
      countsInBadge: true,
      showInBell: true,
      href: alert.href,
      actionKey: alert.actionKey,
      params: alert.params,
      messageKey: `alerts.${alert.id}`,
    }));
  },
};
