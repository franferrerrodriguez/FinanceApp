import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ui } from '../lib/uiClasses';
import { formatMoney } from '../utils/formatters';

const severityStyles = {
  danger:
    'border-red-500/30 bg-red-500/10 text-red-900 dark:border-red-500/35 dark:text-red-100',
  warn:
    'border-amber-500/30 bg-amber-500/10 text-amber-950 dark:border-amber-500/35 dark:text-amber-100',
  info:
    'border-sky-500/30 bg-sky-500/10 text-sky-950 dark:border-sky-500/35 dark:text-sky-100',
};

function formatAlertParams(params = {}) {
  if (!params) return {};
  const next = { ...params };
  for (const key of ['liquid', 'target', 'shortfall']) {
    if (typeof next[key] === 'number') {
      next[key] = formatMoney(next[key]);
    }
  }
  return next;
}

export function FinanceAlerts({ alerts, title, className = '', onAction }) {
  const { t } = useTranslation();

  if (!alerts?.length) return null;

  return (
    <section
      className={`space-y-2 ${className}`}
      aria-label={title ?? t('alerts.sectionAria')}
    >
      {title ? (
        <h3 className={`text-sm font-semibold ${ui.heading}`}>{title}</h3>
      ) : null}
      <ul className="space-y-2" role="list">
        {alerts.map((alert) => {
          const params = formatAlertParams(alert.params);
          const message = t(`alerts.${alert.id}`, {
            ...params,
            defaultValue: t(`dashboard.alerts.${alert.id}`, params),
          });

          return (
            <li
              key={alert.id}
              role="alert"
              className={`rounded-xl border px-4 py-3 text-sm leading-snug ${severityStyles[alert.severity] ?? severityStyles.warn}`}
            >
              <p>{message}</p>
              {alert.href ? (
                <Link
                  to={alert.href}
                  onClick={onAction}
                  className="mt-2 inline-block text-xs font-semibold underline-offset-2 hover:underline"
                >
                  {t(alert.actionKey ?? 'alerts.viewAction')}
                </Link>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
