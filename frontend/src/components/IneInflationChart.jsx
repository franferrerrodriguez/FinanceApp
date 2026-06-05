import { useTranslation } from 'react-i18next';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { buildIneIpcChartPoints } from '../lib/ineInflation';
import { ui } from '../lib/uiClasses';
import { formatPercent } from '../utils/formatters';

const LINE_COLOR = '#34d399';

const chartTheme = {
  grid: '#334155',
  tick: '#94a3b8',
  tooltipBg: '#0f172a',
  tooltipBorder: '#334155',
};

export function IneInflationChart({ history, locale, i18nPrefix = 'dashboard.charts.inflation' }) {
  const { t } = useTranslation();
  const data = buildIneIpcChartPoints(history, locale);

  if (data.length < 2) {
    return (
      <p className={`py-10 text-center text-sm ${ui.textMuted}`}>
        {t(`${i18nPrefix}.empty`)}
      </p>
    );
  }

  const minPercent = Math.min(...data.map((d) => d.percent));
  const maxPercent = Math.max(...data.map((d) => d.percent));
  const padding = Math.max(0.3, (maxPercent - minPercent) * 0.15);
  const yMin = Math.max(0, Math.floor((minPercent - padding) * 10) / 10);
  const yMax = Math.ceil((maxPercent + padding) * 10) / 10;

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
          <CartesianGrid
            stroke={chartTheme.grid}
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: chartTheme.tick, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fill: chartTheme.tick, fontSize: 11 }}
            tickFormatter={(v) => `${v}%`}
            width={40}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: chartTheme.tooltipBg,
              border: `1px solid ${chartTheme.tooltipBorder}`,
              borderRadius: 10,
              fontSize: 13,
            }}
            labelFormatter={(_, payload) =>
              payload?.[0]?.payload?.period ?? ''
            }
            formatter={(value) => [
              formatPercent((value ?? 0) / 100),
              t(`${i18nPrefix}.series`),
            ]}
            labelStyle={{ color: '#e2e8f0' }}
          />
          <Line
            type="monotone"
            dataKey="percent"
            stroke={LINE_COLOR}
            strokeWidth={2.5}
            dot={{ r: 3, fill: LINE_COLOR, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
      <p className={`mt-2 text-xs ${ui.textMuted}`}>
        {t(`${i18nPrefix}.note`, { count: data.length })}
      </p>
    </div>
  );
}
