import { useTranslation } from 'react-i18next';
import { IneInflationChart } from '../../../components/IneInflationChart';
import { useIneIpcBundle } from '../../../hooks/useIneIpcBundle';
import { INE_IPC_SOURCE_URL, formatIneIpcPeriod } from '../../../lib/ineInflation';
import { ui } from '../../../lib/uiClasses';
import { formatPercent } from '../../../utils/formatters';
import { ChartCard } from './ChartCard';

export function IneInflationCard() {
  const { t, i18n } = useTranslation();
  const { status, latest, history } = useIneIpcBundle();
  const period = formatIneIpcPeriod(latest, i18n.language);

  const subtitle =
    status === 'ready' && latest && period
      ? t('dashboard.charts.inflation.subtitle', {
          rate: formatPercent(latest.rate),
          period,
        })
      : status === 'loading'
        ? t('dashboard.charts.inflation.loading')
        : status === 'error'
          ? t('dashboard.charts.inflation.error')
          : null;

  return (
    <ChartCard
      title={t('dashboard.charts.inflation.title')}
      help={t('dashboard.charts.inflation.help')}
      helpAriaLabel={t('dashboard.charts.inflation.helpAria')}
      legend={
        <a
          href={INE_IPC_SOURCE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-[var(--accent)] hover:underline"
        >
          {t('dashboard.charts.inflation.source')}
        </a>
      }
    >
      {subtitle ? (
        <p className={`-mt-2 mb-4 text-sm ${ui.textMuted}`}>{subtitle}</p>
      ) : null}
      {status === 'ready' && history.length > 1 ? (
        <IneInflationChart history={history} locale={i18n.language} />
      ) : null}
    </ChartCard>
  );
}
