import { useTranslation } from 'react-i18next';
import { ui } from '../../../lib/uiClasses';

const severityStyles = {
  danger:
    'border-red-500/25 bg-red-500/10 text-red-800 dark:border-red-500/30 dark:text-red-200',
  warn:
    'border-amber-500/25 bg-amber-500/10 text-amber-900 dark:border-amber-500/30 dark:text-amber-100',
};

export function DashboardAlerts({ alerts }) {
  const { t } = useTranslation();

  if (!alerts.length) return null;

  return (
    <ul className="space-y-2">
      {alerts.map((alert) => (
        <li
          key={alert.id}
          className={`rounded-xl border px-4 py-2.5 text-sm leading-snug ${severityStyles[alert.severity]}`}
        >
          {t(`dashboard.alerts.${alert.id}`)}
        </li>
      ))}
    </ul>
  );
}
