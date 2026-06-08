/** @typedef {'danger' | 'warn' | 'info'} NotificationSeverity */

/** @typedef {'balance_setup' | 'finance_alert'} NotificationSourceId */

/**
 * @typedef {object} FinanceNotification
 * @property {string} id Unique id (source + key)
 * @property {NotificationSourceId} source
 * @property {NotificationSeverity} severity
 * @property {boolean} countsInBadge
 * @property {boolean} showInBell
 * @property {string} [href]
 * @property {string} [actionKey]
 * @property {Record<string, unknown>} [params]
 * @property {string} [messageKey] i18n key under `notifications.*` or `alerts.*`
 */

/**
 * @typedef {object} NotificationContext
 * @property {import('../constants.js').DEFAULT_SETTINGS} settings
 * @property {object[]} snapshots
 * @property {object[]} assets
 * @property {object[]} liabilities
 * @property {object[]} annualExpenses
 * @property {object[]} contributionPlans
 * @property {string} locale
 * @property {ReturnType<import('../balanceSetupProgress.js').getBalanceSetupSteps>} setup
 * @property {object[]} alerts Filtered finance alerts
 * @property {object} emergencyFund
 * @property {object} monthlyClose
 */

/**
 * @typedef {object} NotificationSource
 * @property {NotificationSourceId} id
 * @property {(ctx: NotificationContext) => FinanceNotification[]} collect
 */

export const NOTIFICATION_SOURCE = {
  BALANCE_SETUP: 'balance_setup',
  FINANCE_ALERT: 'finance_alert',
};
