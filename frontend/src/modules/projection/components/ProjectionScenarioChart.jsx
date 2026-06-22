import { useTranslation } from 'react-i18next';
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatMoney } from '../../../utils/formatters';
import { SCENARIO_COLORS } from './scenarioColors';

function buildChartData(pessimisticRows, moderateRows, optimisticRows) {
  const annualModerate = moderateRows.filter((r) => r.monthIndex % 12 === 11);
  return annualModerate.map((r) => ({
    year: r.yearsElapsed + 1,
    pessimistic: pessimisticRows[r.monthIndex]?.patrimonyEnd ?? 0,
    moderate: r.patrimonyEnd,
    optimistic: optimisticRows[r.monthIndex]?.patrimonyEnd ?? 0,
  }));
}

function yAxisFormatter(value) {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M€`;
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)}k€`;
  return `${value}€`;
}

function CustomTooltip({ active, payload, label }) {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.1)] bg-[var(--bg-secondary)] px-3 py-2 text-xs shadow-xl">
      <p className="mb-1.5 font-semibold text-[var(--text-secondary)]">
        Año {label}
      </p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }} className="tabular-nums">
          {t(`projection.scenarios.${entry.dataKey}`)}: {formatMoney(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function ProjectionScenarioChart({
  pessimisticRows,
  moderateRows,
  optimisticRows,
  activeScenario,
}) {
  const { t } = useTranslation();
  const data = buildChartData(pessimisticRows, moderateRows, optimisticRows);
  if (!data.length) return null;

  const opacity = (s) => (activeScenario === s ? 1 : 0.3);
  const strokeWidth = (s) => (activeScenario === s ? 2.5 : 1.5);

  return (
    <div className="h-56 w-full sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <XAxis
            dataKey="year"
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}a`}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={yAxisFormatter}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {t(`projection.scenarios.${value}`)}
              </span>
            )}
          />
          <Line
            type="monotone"
            dataKey="pessimistic"
            stroke={SCENARIO_COLORS.pessimistic.line}
            strokeWidth={strokeWidth('pessimistic')}
            strokeDasharray="5 3"
            dot={false}
            opacity={opacity('pessimistic')}
          />
          <Line
            type="monotone"
            dataKey="moderate"
            stroke={SCENARIO_COLORS.moderate.line}
            strokeWidth={strokeWidth('moderate')}
            dot={false}
            opacity={opacity('moderate')}
          />
          <Line
            type="monotone"
            dataKey="optimistic"
            stroke={SCENARIO_COLORS.optimistic.line}
            strokeWidth={strokeWidth('optimistic')}
            strokeDasharray="5 3"
            dot={false}
            opacity={opacity('optimistic')}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
