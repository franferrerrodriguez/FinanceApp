import { NOTIFICATION_SOURCE } from '../types.js';

/** Reminds user to finish patrimony setup (checklist lives on Dashboard). */
export const balanceSetupNotificationSource = {
  id: NOTIFICATION_SOURCE.BALANCE_SETUP,
  collect(ctx) {
    if (!ctx.setup?.hasPending) return [];

    return [
      {
        id: 'balance_setup',
        source: NOTIFICATION_SOURCE.BALANCE_SETUP,
        severity: 'warn',
        countsInBadge: true,
        showInBell: true,
        href: '/dashboard',
        messageKey: 'notifications.balanceSetup',
        actionKey: 'notifications.balanceSetupAction',
        params: {
          pending: ctx.setup.pendingSteps.length,
          done: ctx.setup.completeCount,
          total: ctx.setup.totalSteps,
        },
      },
    ];
  },
};
