import { useTranslation } from 'react-i18next';
import { FinanceAlerts } from '../../../components/FinanceAlerts';

export function DashboardAlerts({ alerts }) {
  const { t } = useTranslation();
  return (
    <FinanceAlerts alerts={alerts} title={t('dashboard.alertsTitle')} />
  );
}
