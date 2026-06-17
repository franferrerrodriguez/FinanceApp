import { useTranslation } from 'react-i18next';
import { summarizePatrimonyGrowth } from '../../../lib/patrimonyGrowth';
import { ui } from '../../../lib/uiClasses';
import { formatMonthKey } from '../../../utils/monthLabel';
import { formatMoney, formatPercent } from '../../../utils/formatters';
import { NetWorthChart } from '../../dashboard/components/NetWorthChart';

export function PatrimonyEvolutionSection({ snapshots, locale }) {
  const { t } = useTranslation();
  const growth = summarizePatrimonyGrowth(snapshots, 12);

  return (
    <section className={`${ui.chartCard} ${ui.stackSection}`}>
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className={`text-base font-semibold ${ui.heading}`}>
            {t('balance.patrimony.evolutionTitle')}
          </h3>
        </div>
        <p className={`text-sm ${ui.textMuted}`}>
          {t('balance.patrimony.evolutionSubtitle')}
        </p>
      </div>

      {growth.hasGrowth ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <GrowthKpi
            label={t('balance.patrimony.growthPeriod', {
              from: formatMonthKey(growth.firstMonthKey, locale),
              to: formatMonthKey(growth.lastMonthKey, locale),
            })}
            value={formatMoney(growth.absoluteChange)}
            hint={
              growth.percentChange != null
                ? t('balance.patrimony.growthPeriodPct', {
                    percent: formatPercent(growth.percentChange),
                  })
                : null
            }
            positive={growth.absoluteChange >= 0}
          />
          <GrowthKpi
            label={t('balance.patrimony.growthMonthOverMonth')}
            value={
              growth.monthOverMonthDelta != null
                ? formatMoney(growth.monthOverMonthDelta)
                : '—'
            }
            hint={
              growth.monthOverMonthPct != null
                ? t('balance.patrimony.growthPeriodPct', {
                    percent: formatPercent(growth.monthOverMonthPct),
                  })
                : null
            }
            positive={(growth.monthOverMonthDelta ?? 0) >= 0}
          />
          <GrowthKpi
            label={t('balance.patrimony.growthStart')}
            value={formatMoney(growth.startNetWorth)}
          />
          <GrowthKpi
            label={t('balance.patrimony.growthEnd')}
            value={formatMoney(growth.endNetWorth)}
          />
        </div>
      ) : growth.hasData ? (
        <p className={`rounded-xl border px-4 py-3 text-sm ${ui.cardMuted}`}>
          {t('balance.patrimony.evolutionNeedMoreMonths')}
        </p>
      ) : null}

      <NetWorthChart
        history={growth.history}
        title={t('balance.patrimony.evolutionChartTitle')}
        emptyMessage={t('balance.patrimony.evolutionEmpty')}
        embedded
      />
    </section>
  );
}

function GrowthKpi({ label, value, hint, positive }) {
  const valueClass =
    positive === undefined
      ? ui.heading
      : positive
        ? 'text-[var(--color-positive)]'
        : 'text-[var(--color-negative)]';

  return (
    <div className={ui.kpiCard}>
      <p className={`text-xs font-medium ${ui.textMuted}`}>{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${valueClass}`}>{value}</p>
      {hint ? (
        <p className={`mt-1 text-xs leading-snug ${ui.textMuted}`}>{hint}</p>
      ) : null}
    </div>
  );
}
