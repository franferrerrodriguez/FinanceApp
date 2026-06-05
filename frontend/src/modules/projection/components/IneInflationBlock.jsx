import { useTranslation } from 'react-i18next';
import { useIneIpcBundle } from '../../../hooks/useIneIpcBundle';
import { INE_IPC_SOURCE_URL, formatIneIpcPeriod } from '../../../lib/ineInflation';
import { ui } from '../../../lib/uiClasses';
import { formatPercent } from '../../../utils/formatters';

/** Compact INE inflation figure for projection data sources. */
export function IneInflationBlock() {
  const { t, i18n } = useTranslation();
  const { status, latest } = useIneIpcBundle();
  const period = formatIneIpcPeriod(latest, i18n.language);

  return (
    <div className={`rounded-xl border px-4 py-3 ${ui.cardMuted}`}>
      <p className={`text-xs font-medium ${ui.textMuted}`}>
        {t('projection.sources.inflation')}
      </p>
      {status === 'loading' ? (
        <p className={`mt-1 text-sm ${ui.textMuted}`}>
          {t('projection.sources.inflationLoading')}
        </p>
      ) : null}
      {status === 'error' ? (
        <p className={`mt-1 text-sm text-amber-700 dark:text-amber-300`}>
          {t('projection.sources.inflationError')}
        </p>
      ) : null}
      {status === 'ready' && latest ? (
        <>
          <p className={`mt-1 text-lg font-bold tabular-nums ${ui.heading}`}>
            {formatPercent(latest.rate)}
          </p>
          <p className={`mt-1 text-xs ${ui.textMuted}`}>
            {period
              ? t('projection.sources.inflationHint', { period })
              : t('projection.sources.inflationHintFallback')}
          </p>
        </>
      ) : null}
      <a
        href={INE_IPC_SOURCE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
      >
        {t('projection.sources.inflationSource')}
      </a>
    </div>
  );
}
