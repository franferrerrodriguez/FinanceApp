import { useTranslation } from 'react-i18next';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ui } from '../../../lib/uiClasses';
import { formatMonthKey } from '../../../utils/monthLabel';
import { formatMoney, formatMoneyCompact } from '../../../utils/formatters';
import { ChartCard } from './ChartCard';

// DS chart palette
const COLORS = {
  netWorth: '#1D9E75',
  totalAssets: '#378ADD',
};

const chartTheme = {
  grid: 'rgba(255,255,255,0.04)',
  tick: '#8A9AAD',
  tooltipBg: '#1A2030',
  tooltipBorder: 'rgba(255,255,255,0.14)',
};

export function NetWorthChart({
  history,
  title,
  emptyMessage,
  embedded = false,
}) {
  const { t } = useTranslation();
  const chartTitle = title ?? t('dashboard.charts.netWorth.title');
  const chartEmpty = emptyMessage ?? t('dashboard.charts.netWorth.empty');

  const data = history.map((row) => ({
    month: formatMonthKey(row.monthKey),
    netWorth: row.netWorth,
    totalAssets: row.totalAssets,
  }));

  const hasSeries = data.some(
    (d) => d.netWorth != null || d.totalAssets != null,
  );

  const legend = (
    <ul className={`flex flex-wrap gap-x-4 gap-y-1 text-xs ${ui.textMuted}`}>
      <li className="flex items-center gap-1.5">
        <span
          className="inline-block h-0.5 w-5 rounded-full"
          style={{ background: COLORS.netWorth }}
          aria-hidden
        />
        {t('dashboard.charts.netWorth.seriesNetWorth')}
      </li>
      <li className="flex items-center gap-1.5">
        <span
          className="inline-block h-0.5 w-5 rounded-full border-b-2 border-dashed"
          style={{ borderColor: COLORS.totalAssets }}
          aria-hidden
        />
        {t('dashboard.charts.netWorth.seriesAssets')}
      </li>
    </ul>
  );

  const chartBody = !hasSeries ? (
    <div className="flex flex-col items-center gap-3 py-16">
      <p className={`text-center text-sm ${ui.textMuted}`}>{chartEmpty}</p>
    </div>
  ) : (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
        <CartesianGrid
          stroke={chartTheme.grid}
          strokeDasharray="3 3"
          vertical={false}
        />
        <XAxis
          dataKey="month"
          tick={{ fill: chartTheme.tick, fontSize: 11 }}
          axisLine={{ stroke: chartTheme.grid }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: chartTheme.tick, fontSize: 11 }}
          tickFormatter={(v) => formatMoneyCompact(v)}
          width={56}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: chartTheme.tooltipBg,
            border: `0.5px solid ${chartTheme.tooltipBorder}`,
            borderRadius: 12,
            fontSize: 13,
          }}
          formatter={(value) => formatMoney(value)}
          labelStyle={{ color: '#C5D0DC' }}
        />
        <Legend content={() => null} />
        <Line
          type="monotone"
          dataKey="totalAssets"
          name={t('dashboard.charts.netWorth.seriesAssets')}
          stroke={COLORS.totalAssets}
          strokeWidth={2}
          strokeDasharray="6 4"
          dot={false}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="netWorth"
          name={t('dashboard.charts.netWorth.seriesNetWorth')}
          stroke={COLORS.netWorth}
          strokeWidth={2.5}
          dot={{ r: 4, fill: COLORS.netWorth, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );

  if (embedded) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h4 className={`text-sm font-semibold ${ui.heading}`}>{chartTitle}</h4>
          {hasSeries ? <div className="shrink-0">{legend}</div> : null}
        </div>
        {chartBody}
      </div>
    );
  }

  if (!hasSeries) {
    return <ChartCard title={chartTitle}>{chartBody}</ChartCard>;
  }

  return (
    <ChartCard title={chartTitle} legend={legend}>
      {chartBody}
    </ChartCard>
  );
}
