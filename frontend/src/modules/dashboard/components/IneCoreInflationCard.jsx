import { useTranslation } from 'react-i18next';
import { IneInflationChart } from '../../../components/IneInflationChart';
import { useIneIpcCoreBundle } from '../../../hooks/useIneIpcCoreBundle';
import { INE_IPC_CORE_SOURCE_URL } from '../../../lib/ineCoreInflation';
import { formatIneIpcPeriod } from '../../../lib/ineInflation';
import { ui } from '../../../lib/uiClasses';
import { formatPercent } from '../../../utils/formatters';
import { ChartCard } from './ChartCard';

export function IneCoreInflationCard() {
  const { t, i18n } = useTranslation();
  const { status, latest, history } = useIneIpcCoreBundle();
  const period = formatIneIpcPeriod(latest, i18n.language);

  const subtitle =
    status === 'ready' && latest && period
      ? t('dashboard.charts.coreInflation.subtitle', {
          rate: formatPercent(latest.rate),
          period,
        })
      : status === 'loading'
        ? t('dashboard.charts.coreInflation.loading')
        : status === 'error'
          ? t('dashboard.charts.coreInflation.error')
          : null;

  return (
    <ChartCard
      title={t('dashboard.charts.coreInflation.title')}
      help={t('dashboard.charts.coreInflation.help')}
      helpAriaLabel={t('dashboard.charts.coreInflation.helpAria')}
      legend={
        <a
          href={INE_IPC_CORE_SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-[var(--accent)] hover:underline"
        >
          {t('dashboard.charts.coreInflation.source')}
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
          i18nPrefix="dashboard.charts.coreInflation"
        />
      ) : null}
    </ChartCard>
  );
}
