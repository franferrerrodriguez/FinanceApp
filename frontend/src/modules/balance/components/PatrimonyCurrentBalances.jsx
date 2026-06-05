import { useTranslation } from 'react-i18next';
import { SNAPSHOT_ITEM_TYPE } from '../../../lib/snapshotItemTypes';
import { ui } from '../../../lib/uiClasses';
import { formatMoney } from '../../../utils/formatters';

export function PatrimonyCurrentBalances({
  rows,
  asOfLabel,
  hasAnyBalance,
  onUpdate,
  onViewHistory,
}) {
  const { t } = useTranslation();

  if (!rows.length) return null;

  return (
    <section
      id="patrimony-current-balances"
      className={`${ui.chartCard} ${ui.stackSection} scroll-mt-24`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className={`text-base font-semibold ${ui.heading}`}>
            {t('balance.patrimony.currentBalancesTitle')}
          </h3>
          <p className={`mt-1 text-sm ${ui.textMuted}`}>
            {hasAnyBalance
              ? t('balance.patrimony.currentBalancesSubtitle', { date: asOfLabel })
              : t('balance.patrimony.currentBalancesEmpty')}
          </p>
        </div>
        <button
          type="button"
          className={`${ui.btnSecondary} shrink-0`}
          onClick={onUpdate}
        >
          {hasAnyBalance
            ? t('balance.patrimony.currentBalancesUpdate')
            : t('balance.patrimony.recordBalances')}
        </button>
      </div>

      {hasAnyBalance ? (
        <ul className={ui.stackBlocks}>
          {rows.map((row) => (
            <li
              key={`${row.kind}-${row.id}`}
              className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${ui.divider}`}
            >
              <div className="min-w-0">
                <p className={`truncate font-medium ${ui.heading}`}>{row.name}</p>
                <p className={`truncate text-xs ${ui.textMuted}`}>
                  {row.kind === SNAPSHOT_ITEM_TYPE.LIABILITY
                    ? t(`categories.liability.${row.category}`)
                    : t(`categories.asset.${row.category}`)}
                  {row.provider ? ` · ${row.provider}` : ''}
                </p>
              </div>
              <p
                className={`shrink-0 text-right text-lg font-semibold tabular-nums ${
                  row.kind === SNAPSHOT_ITEM_TYPE.LIABILITY
                    ? 'text-red-600 dark:text-red-400'
                    : ui.heading
                }`}
              >
                {row.hasBalance ? formatMoney(row.balance) : '—'}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {hasAnyBalance && onViewHistory ? (
        <button
          type="button"
          onClick={onViewHistory}
          className={`text-sm font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400`}
        >
          {t('balance.patrimony.currentBalancesViewHistory')}
        </button>
      ) : null}
    </section>
  );
}
