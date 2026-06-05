import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HorizontalScrollRegion,
  ScrollHintBanner,
} from '../../../components/HorizontalScrollRegion';
import { getAssetAnnualReturn } from '../../../lib/projectionReturns';
import { ui } from '../../../lib/uiClasses';
import { formatMoney, formatPercent } from '../../../utils/formatters';

export function PatrimonyCatalogTable({
  items,
  kind,
  categoryLabel,
  providerLabel,
  getBalance,
  settings,
  onEdit,
  onDelete,
  onToggleActive,
}) {
  const { t } = useTranslation();
  const scrollRef = useRef(null);

  if (!items.length) return null;

  return (
    <div className="space-y-2">
      <ScrollHintBanner
        hint={t('balance.patrimony.catalogScrollHint')}
        show={items.length > 0}
      />
      <HorizontalScrollRegion
        ref={scrollRef}
        className={`w-full min-w-0 overflow-hidden rounded-xl border ${ui.divider}`}
      >
        <table className="w-full min-w-[36rem] border-collapse text-sm">
          <thead>
            <tr className={`border-b bg-slate-50/90 dark:bg-slate-800/50 ${ui.divider}`}>
              <th className="w-10 px-2 py-2.5" aria-label={t('balance.patrimony.tableActive')} />
              <th
                className={`px-3 py-2.5 text-left text-xs font-semibold ${ui.textLabel}`}
              >
                {kind === 'asset'
                  ? t('balance.patrimony.tableAccount')
                  : t('balance.patrimony.tableName')}
              </th>
              <th
                className={`px-3 py-2.5 text-left text-xs font-semibold ${ui.textLabel}`}
              >
                {t('balance.patrimony.tableCategory')}
              </th>
              {kind === 'asset' ? (
                <th
                  className={`hidden px-3 py-2.5 text-right text-xs font-semibold sm:table-cell ${ui.textLabel}`}
                >
                  {t('balance.patrimony.tableReturn')}
                </th>
              ) : null}
              {kind === 'liability' ? (
                <th
                  className={`hidden px-3 py-2.5 text-right text-xs font-semibold sm:table-cell ${ui.textLabel}`}
                >
                  {t('balance.patrimony.tablePayment')}
                </th>
              ) : null}
              {getBalance ? (
                <th
                  className={`px-3 py-2.5 text-right text-xs font-semibold ${ui.textLabel}`}
                >
                  {t('balance.patrimony.tableBalance')}
                </th>
              ) : null}
              <th className="w-28 px-2 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const inactive = item.isActive === false;

              return (
                <tr
                  key={item.id}
                  className={`border-b last:border-b-0 ${ui.divider} ${
                    inactive ? 'opacity-55' : ''
                  }`}
                >
                  <td className="px-2 py-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={item.isActive !== false}
                      onChange={(e) => onToggleActive(item.id, e.target.checked)}
                      aria-label={t('balance.patrimony.activeInClose')}
                      className="h-4 w-4 rounded border-slate-400 text-emerald-500 focus:ring-emerald-500/40"
                    />
                  </td>
                  <td className={`max-w-[10rem] px-3 py-2.5 font-medium ${ui.heading}`}>
                    <span className="block truncate">{item.name}</span>
                    {item.notes ? (
                      <span className={`mt-0.5 block truncate text-xs ${ui.textMuted}`}>
                        {item.notes}
                      </span>
                    ) : null}
                  </td>
                  <td className={`whitespace-nowrap px-3 py-2.5 ${ui.textLabel}`}>
                    {categoryLabel(item.category)}
                  </td>
                  {kind === 'asset' ? (
                    <td
                      className={`hidden whitespace-nowrap px-3 py-2.5 text-right tabular-nums sm:table-cell ${ui.textMuted}`}
                      title={t('balance.patrimony.tableReturnAssetHint')}
                    >
                      {formatPercent(getAssetAnnualReturn(settings, item))}
                    </td>
                  ) : null}
                  {kind === 'liability' ? (
                    <td
                      className={`hidden whitespace-nowrap px-3 py-2.5 text-right tabular-nums sm:table-cell ${ui.textLabel}`}
                    >
                      {providerLabel?.(item)}
                    </td>
                  ) : null}
                  {getBalance ? (
                    <td
                      className={`whitespace-nowrap px-3 py-2.5 text-right tabular-nums ${
                        kind === 'liability'
                          ? 'text-red-600 dark:text-red-400'
                          : ui.textLabel
                      }`}
                    >
                      {(() => {
                        const balance = getBalance(item);
                        return balance != null ? formatMoney(balance) : '—';
                      })()}
                    </td>
                  ) : null}
                  <td className="px-2 py-2.5 text-right">
                    <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end sm:gap-3">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className={ui.actionLink}
                      >
                        {t('balance.patrimony.editRow')}
                      </button>
                      {onDelete ? (
                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          className={ui.actionLinkDanger}
                        >
                          {t('balance.patrimony.deleteRow')}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </HorizontalScrollRegion>
    </div>
  );
}
