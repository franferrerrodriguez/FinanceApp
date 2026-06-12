import { useTranslation } from 'react-i18next';
import { IneInflationChart } from '../../../components/IneInflationChart';
import { useEcbEuriborBundle } from '../../../hooks/useEcbEuriborBundle';
import { ECB_EURIBOR_SOURCE_URL } from '../../../lib/ecbEuribor';
import { formatIneIpcPeriod } from '../../../lib/ineInflation';
import { ui } from '../../../lib/uiClasses';
import { formatPercent } from '../../../utils/formatters';
import { ChartCard } from './ChartCard';

export function EcbEuriborCard() {
  const { t, i18n } = useTranslation();
  const { status, latest, history } = useEcbEuriborBundle();
  const period = formatIneIpcPeriod(latest, i18n.language);

  const subtitle =
    status === 'ready' && latest && period
      ? t('dashboard.charts.interestRate.subtitle', {
          rate: formatPercent(latest.rate),
          period,
        })
      : status === 'loading'
        ? t('dashboard.charts.interestRate.loading')
        : status === 'error'
          ? t('dashboard.charts.interestRate.error')
          : null;

  return (
    <ChartCard
      title={t('dashboard.charts.interestRate.title')}
      help={t('dashboard.charts.interestRate.help')}
      helpAriaLabel={t('dashboard.charts.interestRate.helpAria')}
      legend={
        <a
          href={ECB_EURIBOR_SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
        >
          {t('dashboard.charts.interestRate.source')}
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
          i18nPrefix="dashboard.charts.interestRate"
        />
      ) : null}
    </ChartCard>
  );
}
