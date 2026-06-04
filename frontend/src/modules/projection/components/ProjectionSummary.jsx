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

      <div
        className={`rounded-xl border px-4 py-3 text-sm ${ui.cardMuted}`}
        aria-label={t('projection.summary.breakdownTitle')}
      >
        <p className={`mb-3 font-medium ${ui.heading}`}>
          {t('projection.summary.breakdownTitle')}
        </p>
        <dl className="space-y-2">
          {initialPatrimony > 0 ? (
            <BreakdownRow
              label={t('projection.summary.breakdownInitial')}
              value={formatMoney(initialPatrimony)}
            />
          ) : null}
          <BreakdownRow
            label={t('projection.summary.breakdownContributed')}
            value={`+ ${formatMoney(totalNetContributed)}`}
          />
          <BreakdownRow
            label={t('projection.summary.breakdownReturn')}
            value={`+ ${formatMoney(totalReturnGenerated)}`}
          />
          <BreakdownRow
            label={t('projection.summary.breakdownFinal')}
            value={formatMoney(finalPatrimony)}
            emphasis
          />
        </dl>
      </div>
    </div>
  );
}

function BreakdownRow({ label, value, emphasis = false }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 tabular-nums ${
        emphasis ? `border-t pt-2 ${ui.divider}` : ''
      }`}
    >
      <dt className={`min-w-0 text-left ${emphasis ? ui.heading : ui.text}`}>
        {label}
      </dt>
      <dd
        className={`shrink-0 text-right font-semibold ${
          emphasis ? ui.heading : ui.textLabel
        }`}
      >
        {value}
      </dd>
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
