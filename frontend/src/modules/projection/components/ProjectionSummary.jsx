import { useTranslation } from 'react-i18next';
import { ui } from '../../../lib/uiClasses';
import { formatMoney, formatPercent } from '../../../utils/formatters';

export function ProjectionSummary({ summary, configuredAnnualRate }) {
  const { t } = useTranslation();

  if (!summary) return null;

  const {
    initialPatrimony,
    finalPatrimony,
    totalNetContributed,
    totalReturnGenerated,
    averageSavingsRate,
  } = summary;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label={t('projection.summary.finalPatrimony')}
          value={formatMoney(finalPatrimony)}
        />
        <MetricCard
          label={t('projection.summary.totalContributed')}
          value={formatMoney(totalNetContributed)}
        />
        <MetricCard
          label={t('projection.summary.returnGenerated')}
          value={formatMoney(totalReturnGenerated)}
          hint={t('projection.summary.returnGeneratedHint')}
        />
        <MetricCard
          label={t('projection.summary.configuredReturn')}
          value={formatPercent(configuredAnnualRate ?? 0)}
          hint={t('projection.summary.configuredReturnHint')}
        />
        <MetricCard
          label={t('projection.summary.averageSavingsRate')}
          value={formatPercent(averageSavingsRate)}
        />
      </div>

      <p
        className={`rounded-xl border px-4 py-3 text-sm tabular-nums ${ui.cardMuted} ${ui.text}`}
      >
        {t('projection.summary.equation', {
          final: formatMoney(finalPatrimony),
          contributed: formatMoney(totalNetContributed),
          returnAmount: formatMoney(totalReturnGenerated),
          initial: formatMoney(initialPatrimony),
        })}
      </p>
    </div>
  );
}

function MetricCard({ label, value, hint }) {
  return (
    <div className={ui.kpiCard}>
      <p className={`text-xs font-medium ${ui.textMuted}`}>{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${ui.heading}`}>{value}</p>
      {hint ? (
        <p className={`mt-1 text-xs leading-snug ${ui.textMuted}`} title={hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
