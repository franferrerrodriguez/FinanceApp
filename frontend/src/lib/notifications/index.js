import { buildNotificationContext } from './context.js';
import {
  collectNotifications,
  getNotificationSources,
  registerNotificationSource,
} from './registry.js';
import { balanceSetupNotificationSource } from './sources/balanceSetup.js';
import { financeAlertsNotificationSource } from './sources/financeAlerts.js';

registerNotificationSource(balanceSetupNotificationSource);
registerNotificationSource(financeAlertsNotificationSource);

/**
 * Aggregates finance notifications from all registered sources.
 * Add new casuistics via `registerNotificationSource` in app init or a new source file.
 */
export function computeFinanceNotifications(input) {
  const ctx = buildNotificationContext(input);
  const items = collectNotifications(ctx);
  const bellItems = items.filter((item) => item.showInBell);
  const badgeCount = items.filter((item) => item.countsInBadge).length;

  return {
    items,
    bellItems,
    badgeCount,
    hasDanger: items.some((item) => item.severity === 'danger'),
    setup: ctx.setup,
    alerts: ctx.alerts,
    emergencyFund: ctx.emergencyFund,
    monthlyClose: ctx.monthlyClose,
    kpis: ctx.kpis,
  };
}

export {
  buildNotificationContext,
  collectNotifications,
  getNotificationSources,
  registerNotificationSource,
};
