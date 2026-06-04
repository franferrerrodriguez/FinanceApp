import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ui } from '../../../lib/uiClasses';
import { formatMoney } from '../../../utils/formatters';
import { ChartCard } from './ChartCard';

/** Orden y colores alineados con la referencia visual */
const SEGMENT_ORDER = ['fixed', 'variable', 'investment', 'free'];

const SEGMENT_COLORS = {
  fixed: '#f97316',
  variable: '#eab308',
  investment: '#3b82f6',
  free: '#34d399',
};

export function CashflowChart({ segments, income }) {
  const { t } = useTranslation();

  const ordered = SEGMENT_ORDER.map((key) =>
    segments.find((s) => s.key === key),
  ).filter((s) => s && s.percent > 0.2);

  const data = [
    {
      name: 'cashflow',
      ...Object.fromEntries(ordered.map((s) => [s.key, s.percent])),
    },
  ];

  const firstKey = ordered[0]?.key;
  const lastKey = ordered[ordered.length - 1]?.key;

  return (
    <ChartCard title={t('dashboard.charts.cashflow.title')}>
      <ResponsiveContainer width="100%" height={56}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          barCategoryGap={0}
        >
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            contentStyle={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 10,
              fontSize: 13,
            }}
            formatter={(value, key) => {
              const seg = segments.find((s) => s.key === key);
              return [
                `${Number(value).toFixed(0)}% · ${formatMoney(seg?.amount ?? 0)}`,
                t(`dashboard.charts.cashflow.segments.${key}`),
              ];
            }}
          />
          {ordered.map((seg) => {
            const isFirst = seg.key === firstKey;
            const isLast = seg.key === lastKey;
            const radius = isFirst
              ? [10, 0, 0, 10]
              : isLast
                ? [0, 10, 10, 0]
                : [0, 0, 0, 0];

            return (
              <Bar
                key={seg.key}
                dataKey={seg.key}
                stackId="cashflow"
                fill={SEGMENT_COLORS[seg.key]}
                barSize={48}
                radius={radius}
              />
            );
          })}
        </BarChart>
      </ResponsiveContainer>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <LegendItem
          color="#22c55e"
          label={t('dashboard.charts.cashflow.income')}
          amount={formatMoney(income)}
        />
        {SEGMENT_ORDER.map((key) => {
          const seg = segments.find((s) => s.key === key);
          if (!seg || seg.amount <= 0) return null;
          return (
            <LegendItem
              key={key}
              color={SEGMENT_COLORS[key]}
              label={t(`dashboard.charts.cashflow.segments.${key}`)}
              amount={formatMoney(seg.amount)}
            />
          );
        })}
      </ul>
    </ChartCard>
  );
}

function LegendItem({ color, label, amount }) {
  return (
    <li className="flex items-center gap-2.5 min-w-0">
      <span
        className="h-3 w-3 shrink-0 rounded-sm"
        style={{ background: color }}
        aria-hidden
      />
      <span className={`truncate text-sm ${ui.textLabel}`}>{label}</span>
      <span className={`ml-auto shrink-0 text-sm font-semibold tabular-nums ${ui.heading}`}>
        {amount}
      </span>
    </li>
  );
}
