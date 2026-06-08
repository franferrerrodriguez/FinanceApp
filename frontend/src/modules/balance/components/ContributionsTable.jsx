import { useTranslation } from 'react-i18next';
import { resolveLinkedAsset } from '../../../lib/contributionEntries';
import { ui } from '../../../lib/uiClasses';
import { formatMoney } from '../../../utils/formatters';

function formatEntryDate(date, locale) {
  const value = String(date ?? '').slice(0, 10);
  if (!value) return '—';
  try {
    return new Date(`${value}T12:00:00`).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return value;
  }
}

export function ContributionsTable({ entries, assets, locale, onEdit, onDelete }) {
  const { t } = useTranslation();

  if (!entries.length) return null;

  return (
    <div className={`overflow-hidden rounded-xl border ${ui.divider}`}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className={`border-b bg-slate-50/90 dark:bg-slate-800/50 ${ui.divider}`}>
            <th className={`px-3 py-2.5 text-left text-xs font-semibold ${ui.textLabel}`}>
              {t('balance.contributions.tableDate')}
            </th>
            <th className={`px-3 py-2.5 text-left text-xs font-semibold ${ui.textLabel}`}>
              {t('balance.contributions.tableDestination')}
            </th>
            <th
              className={`hidden px-3 py-2.5 text-left text-xs font-semibold sm:table-cell ${ui.textLabel}`}
            >
              {t('balance.contributions.tableCategory')}
            </th>
            <th className={`px-3 py-2.5 text-right text-xs font-semibold ${ui.textLabel}`}>
              {t('balance.contributions.tableAmount')}
            </th>
            <th className="w-28 px-2 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const linkedAsset = resolveLinkedAsset(entry, assets);
            const assetMissing = entry.assetId && !linkedAsset;

            return (
              <tr
                key={entry.id}
                className={`border-b last:border-b-0 ${ui.divider}`}
              >
                <td className={`whitespace-nowrap px-3 py-2.5 ${ui.textLabel}`}>
                  {formatEntryDate(entry.date, locale)}
                </td>
                <td className={`max-w-[12rem] px-3 py-2.5 font-medium ${ui.heading}`}>
                  <span className="block truncate">
                    {linkedAsset?.name ??
                      (assetMissing
                        ? t('balance.contributions.assetDeleted')
                        : t('balance.contributions.unnamedAsset'))}
                  </span>
                </td>
                <td
                  className={`hidden whitespace-nowrap px-3 py-2.5 sm:table-cell ${ui.textLabel}`}
                >
                  {linkedAsset
                    ? t(`categories.asset.${linkedAsset.category}`)
                    : '—'}
                </td>
                <td
                  className={`whitespace-nowrap px-3 py-2.5 text-right tabular-nums ${ui.textLabel}`}
                >
                  {formatMoney(entry.amount ?? 0)}
                </td>
                <td className="px-2 py-2.5 text-right">
                  <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end sm:gap-3">
                    <button
                      type="button"
                      onClick={() => onEdit(entry)}
                      className={ui.actionLink}
                    >
                      {t('balance.contributions.editRow')}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(entry)}
                      className={ui.actionLinkDanger}
                    >
                      {t('balance.contributions.deleteRow')}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
