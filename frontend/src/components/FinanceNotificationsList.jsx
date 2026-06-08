import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { NOTIFICATION_SOURCE } from '../lib/notifications/types';
import { ui } from '../lib/uiClasses';
import { formatMoney } from '../utils/formatters';
import { FinanceAlerts } from './FinanceAlerts';

const severityStyles = {
  danger:
    'border-red-500/30 bg-red-500/10 text-red-900 dark:border-red-500/35 dark:text-red-100',
  warn:
    'border-amber-500/30 bg-amber-500/10 text-amber-950 dark:border-amber-500/35 dark:text-amber-100',
  info: ui.cardMuted,
};

function formatParams(params = {}) {
  const next = { ...params };
  for (const key of ['liquid', 'target', 'shortfall']) {
    if (typeof next[key] === 'number') {
      next[key] = formatMoney(next[key]);
    }
  }
  return next;
}

function SetupNotificationCard({ item, onAction }) {
  const { t } = useTranslation();
  const params = formatParams(item.params);
  const message = t(item.messageKey, params);

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm leading-snug ${severityStyles[item.severity] ?? severityStyles.warn}`}
    >
      <p className={`text-xs font-semibold uppercase tracking-wide ${ui.textMuted}`}>
        {t('notifications.setupSection')}
      </p>
      <p className="mt-1.5">{message}</p>
      {item.href ? (
        <Link
          to={item.href}
          onClick={onAction}
          className="mt-2 inline-block text-xs font-semibold underline-offset-2 hover:underline"
        >
          {t(item.actionKey ?? 'notifications.balanceSetupAction')}
        </Link>
      ) : null}
    </div>
  );
}

export function FinanceNotificationsList({ items, onAction, className = '' }) {
  const { t } = useTranslation();

  if (!items?.length) return null;

  const setupItems = items.filter(
    (item) => item.source === NOTIFICATION_SOURCE.BALANCE_SETUP,
  );
  const alertItems = items.filter(
    (item) => item.source === NOTIFICATION_SOURCE.FINANCE_ALERT,
  );
  const otherItems = items.filter(
    (item) =>
      item.source !== NOTIFICATION_SOURCE.BALANCE_SETUP &&
      item.source !== NOTIFICATION_SOURCE.FINANCE_ALERT,
  );

  return (
    <div className={`space-y-3 ${className}`}>
      {setupItems.map((item) => (
        <SetupNotificationCard key={item.id} item={item} onAction={onAction} />
      ))}

      {otherItems.map((item) => {
        const params = formatParams(item.params);
        const message = t(item.messageKey, {
          ...params,
          defaultValue: item.messageKey,
        });

        return (
          <div
            key={item.id}
            className={`rounded-xl border px-4 py-3 text-sm leading-snug ${severityStyles[item.severity] ?? severityStyles.warn}`}
          >
            <p>{message}</p>
            {item.href ? (
              <Link
                to={item.href}
                onClick={onAction}
                className="mt-2 inline-block text-xs font-semibold underline-offset-2 hover:underline"
              >
                {t(item.actionKey ?? 'alerts.viewAction')}
              </Link>
            ) : null}
          </div>
        );
      })}

      {alertItems.length > 0 ? (
        <FinanceAlerts
          alerts={alertItems}
          title={setupItems.length > 0 ? t('alerts.noticesTitle') : undefined}
          onAction={onAction}
        />
      ) : null}
    </div>
  );
}
