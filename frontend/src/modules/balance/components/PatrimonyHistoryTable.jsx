import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HorizontalScrollRegion,
  ScrollHintBanner,
} from '../../../components/HorizontalScrollRegion';
import { buildPatrimonyHistoryTable } from '../../../lib/patrimony';
import { usePreferences } from '../../../store/hooks';
import { formatMonthKey } from '../../../utils/monthLabel';
import { SNAPSHOT_ITEM_TYPE } from '../../../lib/snapshotItemTypes';
import { ui } from '../../../lib/uiClasses';
import { formatMoney, formatPercent } from '../../../utils/formatters';

export function PatrimonyHistoryTable({ assets, liabilities, snapshots }) {
  const { t } = useTranslation();
  const { locale } = usePreferences();
  const scrollRef = useRef(null);
  const table = buildPatrimonyHistoryTable({ assets, liabilities, snapshots });

  if (!table.valueGrid.length) {
    return (
      <p className={`text-sm ${ui.textMuted}`}>{t('balance.patrimony.historyEmpty')}</p>
    );
  }

  const monthLabels = table.monthKeys.map((mk) =>
    formatMonthKey(mk, locale),
  );

  return (
    <div className="space-y-2">
      <ScrollHintBanner
        hint={t('balance.patrimony.historyScrollHint')}
        show
      />
      <HorizontalScrollRegion
        ref={scrollRef}
        className={`w-full min-w-0 overflow-hidden ${ui.block}`}
      >
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr className={`border-b ${ui.divider}`}>
              <th
                className={`sticky left-0 z-10 min-w-[10rem] bg-white px-3 py-2 text-left text-xs font-semibold dark:bg-slate-900 ${ui.textLabel}`}
              >
                {t('balance.patrimony.historyRow')}
              </th>
              {monthLabels.map((label) => (
                <th
                  key={label}
                  className={`min-w-[5.5rem] px-2 py-2 text-right text-xs font-medium ${ui.textMuted}`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.categoryTotals.map((row) => (
              <tr
                key={row.category}
                className={`border-b border-dashed ${ui.divider} bg-slate-50/50 dark:bg-slate-800/30`}
              >
                <td
                  className={`sticky left-0 z-10 bg-slate-50/90 px-3 py-1.5 text-xs font-medium dark:bg-slate-800/90 ${ui.textMuted}`}
                >
                  {t(`categories.asset.${row.category}`)}
                </td>
                {row.values.map((v, i) => (
                  <td
                    key={table.monthKeys[i]}
                    className={`px-2 py-1.5 text-right text-xs tabular-nums ${ui.textMuted}`}
                  >
                    {v != null ? formatMoney(v) : '—'}
                  </td>
                ))}
              </tr>
            ))}

            {table.valueGrid.map(({ item, values }) => (
              <tr key={`${item.type}-${item.id}`} className={`border-b ${ui.divider}`}>
                <td
                  className={`sticky left-0 z-10 bg-white px-3 py-2 dark:bg-slate-900 ${ui.textLabel}`}
                >
                  <span className="block font-medium">{item.name}</span>
                  {item.sublabel ? (
                    <span className={`block text-xs ${ui.textMuted}`}>{item.sublabel}</span>
                  ) : null}
                </td>
                {values.map((v, i) => (
                  <td
                    key={table.monthKeys[i]}
                    className={`px-2 py-2 text-right tabular-nums ${
                      item.type === SNAPSHOT_ITEM_TYPE.LIABILITY
                        ? 'text-red-600 dark:text-red-400'
                        : ui.heading
                    }`}
                  >
                    {v != null ? formatMoney(v) : '—'}
                  </td>
                ))}
              </tr>
            ))}

            <SummaryRow
              label={t('balance.patrimony.totalAssets')}
              values={table.monthTotals.map((m) => m.totalAssets)}
              monthKeys={table.monthKeys}
              positive
            />
            <SummaryRow
              label={t('balance.patrimony.totalLiabilities')}
              values={table.monthTotals.map((m) => m.totalLiabilities)}
              monthKeys={table.monthKeys}
              liability
            />
            <SummaryRow
              label={t('balance.patrimony.netWorth')}
              values={table.monthTotals.map((m) => m.netWorth)}
              monthKeys={table.monthKeys}
              bold
              deltas
              prevValues={table.monthTotals.map((m, i) =>
                i > 0 ? table.monthTotals[i - 1].netWorth : null,
              )}
            />
          </tbody>
        </table>
      </HorizontalScrollRegion>
    </div>
  );
}

function SummaryRow({
  label,
  values,
  monthKeys,
  positive,
  liability,
  bold,
  deltas,
  prevValues,
}) {
  return (
    <tr className={`border-t-2 ${ui.divider} bg-slate-50/80 dark:bg-slate-800/50`}>
      <td
        className={`sticky left-0 z-10 bg-slate-50/95 px-3 py-2 text-sm font-semibold dark:bg-slate-800/95 ${ui.heading}`}
      >
        {label}
      </td>
      {values.map((v, i) => {
        const prev = prevValues?.[i];
        const delta = deltas && v != null && prev != null ? v - prev : null;
        const pct =
          deltas && delta != null && prev !== 0
            ? delta / Math.abs(prev)
            : null;
        let className = bold ? ui.heading : ui.text;
        if (liability && v != null) className = 'text-red-600 dark:text-red-400';
        if (positive && v != null) className = ui.heading;

        return (
          <td key={monthKeys[i]} className={`px-2 py-2 text-right text-sm tabular-nums ${className}`}>
            <span className="block font-semibold">{v != null ? formatMoney(v) : '—'}</span>
            {delta != null ? (
              <span
                className={`block text-xs ${
                  delta >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {delta >= 0 ? '+' : ''}
                {formatMoney(delta)}
                {pct != null ? ` (${formatPercent(pct)})` : ''}
              </span>
            ) : null}
          </td>
        );
      })}
    </tr>
  );
}
