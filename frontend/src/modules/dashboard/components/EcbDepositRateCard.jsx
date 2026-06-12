import { useTranslation } from 'react-i18next';
import { IneInflationChart } from '../../../components/IneInflationChart';
import { useEcbDepositRateBundle } from '../../../hooks/useEcbDepositRateBundle';
import { ECB_DEPOSIT_RATE_SOURCE_URL } from '../../../lib/ecbDepositRate';
import { formatIneIpcPeriod } from '../../../lib/ineInflation';
import { ui } from '../../../lib/uiClasses';
import { formatPercent } from '../../../utils/formatters';
import { ChartCard } from './ChartCard';

export function EcbDepositRateCard() {
  const { t, i18n } = useTranslation();
  const { status, latest, history } = useEcbDepositRateBundle();
  const period = formatIneIpcPeriod(latest, i18n.language);

  const subtitle =
    status === 'ready' && latest && period
      ? t('dashboard.charts.depositRate.subtitle', {
          rate: formatPercent(latest.rate),
          period,
        })
      : status === 'loading'
        ? t('dashboard.charts.depositRate.loading')
        : status === 'error'
          ? t('dashboard.charts.depositRate.error')
          : null;

  return (
    <ChartCard
      title={t('dashboard.charts.depositRate.title')}
      help={t('dashboard.charts.depositRate.help')}
      helpAriaLabel={t('dashboard.charts.depositRate.helpAria')}
      legend={
        <a
          href={ECB_DEPOSIT_RATE_SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
        >
          {t('dashboard.charts.depositRate.source')}
        </a>
      }
    >
      {subtitle ? (
        <p className={`-mt-2 mb-4 text-sm ${ui.textMuted}`}>{subtitle}</p>
      ) : null}
      {status === 'ready' && history.length > 1 ? (
        <IneInflationChart
          history={history}
          locale={i18n.language}
          i18nPrefix="dashboard.charts.depositRate"
        />
      ) : null}
    </ChartCard>
  );
}
