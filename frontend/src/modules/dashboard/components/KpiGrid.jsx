import { useTranslation } from 'react-i18next';
import { getSavingsTone, KpiCard } from '../../../components/KpiCard';
import { formatMoney, formatPercent } from '../../../utils/formatters';

export function KpiGrid({ kpis }) {
  const { t } = useTranslation();
  const { latest, monthDeltas, savingsRate, monthlySavingsAmount, income } =
    kpis;

  const items = [
    {
      label: t('dashboard.kpi.netWorth'),
      value: formatMoney(latest.netWorth),
      valueTone: latest.netWorth >= 0 ? 'default' : 'danger',
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
      : t('dashboard.kpi.trendImprovement', {
          amount: formatMoney(Math.abs(delta)),
        }),
    tone: debtIncreased ? 'negative' : 'positive',
  };
}
