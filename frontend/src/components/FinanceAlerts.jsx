import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ui } from '../lib/uiClasses';
import { formatMoney } from '../utils/formatters';

const severityStyles = {
  danger:
    'rounded-xl [border:0.5px_solid_rgba(226,75,74,0.25)] bg-[rgba(226,75,74,0.10)] text-[var(--color-negative)]',
  warn:
    'rounded-xl [border:0.5px_solid_rgba(239,159,39,0.25)] bg-[rgba(239,159,39,0.10)] text-[var(--color-warning)]',
  info:
    'rounded-xl [border:0.5px_solid_rgba(55,138,221,0.25)] bg-[rgba(55,138,221,0.10)] text-[var(--color-info)]',
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
              className={`px-4 py-3 text-sm leading-snug ${severityStyles[alert.severity] ?? severityStyles.warn}`}
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
