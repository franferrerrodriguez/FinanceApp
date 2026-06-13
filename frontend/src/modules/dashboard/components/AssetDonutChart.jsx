import { useTranslation } from 'react-i18next';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ui } from '../../../lib/uiClasses';
import { formatMoney } from '../../../utils/formatters';

const COLORS = [
  '#1D9E75',
  '#378ADD',
  '#EF9F27',
  '#E24B4A',
  '#5DCAA5',
  '#8A9AAD',
];

export function AssetDonutChart({ distribution }) {
  const { t } = useTranslation();

  if (!distribution.length) {
    return (
      <div className={ui.chartCard}>
        <h3 className={`mb-4 text-sm font-medium ${ui.textLabel}`}>
          {t('dashboard.charts.assets.title')}
        </h3>
        <p className={`py-12 text-center text-sm ${ui.textMuted}`}>
          {t('dashboard.charts.assets.empty')}
        </p>
      </div>
    );
  }

  const data = distribution.map((d) => ({
    name: t(`categories.asset.${d.category}`),
    value: d.value,
    category: d.category,
  }));

  return (
    <div className={ui.chartCard}>
      <h3 className={`mb-4 text-sm font-medium ${ui.textLabel}`}>
        {t('dashboard.charts.assets.title')}
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#1A2030',
              border: '0.5px solid rgba(255,255,255,0.14)',
              borderRadius: 12,
            }}
            formatter={(value) => formatMoney(value)}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className={`mt-2 space-y-1 text-xs ${ui.text}`}>
        {data.map((d, i) => (
          <li key={d.category} className="flex justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              {d.name}
            </span>
            <span>{formatMoney(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
