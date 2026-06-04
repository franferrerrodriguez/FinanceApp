import { useTranslation } from 'react-i18next';
import { DEFAULT_SETTINGS } from '../../../lib/constants';
import { ui } from '../../../lib/uiClasses';
import { formatMoney, formatPercent } from '../../../utils/formatters';

export function KpiGrid({ kpis }) {
  const { t } = useTranslation();
  const { latest, monthDeltas, savingsRate, monthlySavingsAmount, income } =
    kpis;

  const items = [
    {
      label: t('dashboard.kpi.netWorth'),
      value: formatMoney(latest.netWorth),
      valueTone:
        latest.netWorth >= 0 ? 'default' : 'danger',
      trend: formatDeltaTrend(monthDeltas.netWorth, 'up', t),
    },
    {
      label: t('dashboard.kpi.totalAssets'),
      value: formatMoney(latest.totalAssets),
      trend: formatDeltaTrend(monthDeltas.totalAssets, 'up', t),
    },
    {
      label: t('dashboard.kpi.totalLiabilities'),
      value: formatMoney(-Math.abs(latest.totalLiabilities)),
      valueTone: 'liability',
      trend: formatLiabilityTrend(monthDeltas.totalLiabilities, t),
    },
    {
      label: t('dashboard.kpi.savingsRate'),
      value: formatPercent(savingsRate),
      valueTone: getSavingsTone(savingsRate),
      subValue:
        income > 0
          ? t('dashboard.kpi.savingsPerMonth', {
              amount: formatMoney(monthlySavingsAmount),
            })
          : null,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <KpiCard key={item.label} {...item} />
      ))}
    </div>
  );
}

function formatDeltaTrend(delta, positiveDirection, t) {
  if (delta == null || delta === 0) return null;
  const up = delta > 0;
  const favorable = positiveDirection === 'up' ? up : !up;
  return {
    arrow: up ? '↑' : '↓',
    text: t('dashboard.kpi.trendThisMonth', {
      amount: formatMoney(Math.abs(delta)),
    }),
    tone: favorable ? 'positive' : 'negative',
  };
}

function formatLiabilityTrend(delta, t) {
  if (delta == null || delta === 0) return null;
  const debtIncreased = delta > 0;
  return {
    arrow: debtIncreased ? '↑' : '↓',
    text: debtIncreased
      ? formatMoney(delta)
      : t('dashboard.kpi.trendImprovement', { amount: formatMoney(Math.abs(delta)) }),
    tone: debtIncreased ? 'negative' : 'positive',
  };
}

function getSavingsTone(rate) {
  if (rate >= DEFAULT_SETTINGS.SAVINGS_RATE_GREEN) return 'positive';
  if (rate >= DEFAULT_SETTINGS.SAVINGS_RATE_YELLOW) return 'warn';
  return 'danger';
}

function KpiCard({ label, value, valueTone = 'default', trend, subValue }) {
  const valueClass =
    valueTone === 'danger' || valueTone === 'liability'
      ? 'text-orange-500 dark:text-orange-400'
      : valueTone === 'positive'
        ? 'text-emerald-600 dark:text-emerald-400'
        : valueTone === 'warn'
          ? 'text-amber-600 dark:text-amber-400'
          : ui.heading;

  return (
    <article className={ui.kpiCard}>
      <p className={`text-sm font-medium ${ui.textMuted}`}>{label}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight sm:text-[1.65rem] ${valueClass}`}>
        {value}
      </p>
      {subValue ? (
        <p className={`mt-1.5 text-sm ${ui.text}`}>{subValue}</p>
      ) : trend ? (
        <p
          className={`mt-2 flex items-center gap-1 text-sm font-medium ${
            trend.tone === 'positive'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-500 dark:text-red-400'
          }`}
        >
          <span aria-hidden>{trend.arrow}</span>
          <span>{trend.text}</span>
        </p>
      ) : (
        <p className={`mt-2 text-sm ${ui.textMuted}`}>—</p>
      )}
    </article>
  );
}
