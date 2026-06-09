import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { resolveNumPagas } from '../lib/salary';
import { ui } from '../lib/uiClasses';
import { usePreferences } from '../store/hooks';
import { formatMonthKey } from '../utils/monthLabel';
import { formatMoney } from '../utils/formatters';
import {
  HorizontalScrollRegion,
  ScrollHintBanner,
} from './HorizontalScrollRegion';

function formatPaysLabel(item, t) {
  const preset = item.salaryPaysPreset ?? '12';
  if (preset === '14') return t('balance.cashflow.salaryPays.14');
  if (preset === 'other') {
    const n = resolveNumPagas(item);
    return t('balance.cashflow.salaryPaysCustomCount', { count: n });
  }
  return t('balance.cashflow.salaryPays.12');
}

export function SalaryHistoryTable({
  items,
  isCurrentItem,
  onEdit,
  onDelete,
}) {
  const { t } = useTranslation();
  const { locale } = usePreferences();
  const scrollRef = useRef(null);

  if (!items.length) return null;

  return (
    <div className="space-y-2">
      <ScrollHintBanner
        hint={t('balance.cashflow.salaryTableScrollHint')}
        show={items.length > 0}
      />
      <HorizontalScrollRegion
        ref={scrollRef}
        className={`w-full min-w-0 overflow-hidden rounded-xl border ${ui.divider}`}
      >
        <table className="w-full min-w-[28rem] border-separate border-spacing-0 text-sm">
          <thead>
            <tr className={`bg-slate-50/90 dark:bg-slate-800/50`}>
              <th
                className={`rounded-tl-xl border-b px-3 py-2.5 text-left text-xs font-semibold ${ui.divider} ${ui.textLabel}`}
              >
                {t('balance.cashflow.salaryTableFrom')}
              </th>
              <th
                className={`border-b px-3 py-2.5 text-right text-xs font-semibold ${ui.divider} ${ui.textLabel}`}
              >
                {t('balance.cashflow.salaryTableNet')}
              </th>
              <th
                className={`hidden border-b px-3 py-2.5 text-left text-xs font-semibold sm:table-cell ${ui.divider} ${ui.textLabel}`}
              >
                {t('balance.cashflow.salaryTablePays')}
              </th>
              <th
                className={`border-b px-3 py-2.5 text-right text-xs font-semibold ${ui.divider} ${ui.textLabel}`}
              >
                {t('balance.cashflow.salaryTableMonthly')}
              </th>
              <th
                className={`w-28 rounded-tr-xl border-b px-2 py-2.5 ${ui.divider}`}
              />
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const isCurrent = isCurrentItem(item);
              const isLastRow = index === items.length - 1;

              return (
                <tr key={item.id}>
                  <td
                    className={`border-b px-3 py-2.5 ${ui.divider} ${ui.textLabel} ${isLastRow ? 'rounded-bl-xl border-b-0' : ''}`}
                  >
                    <span className="block whitespace-nowrap font-medium">
                      {formatMonthKey(item.effectiveFrom, locale)}
                    </span>
                    {isCurrent ? (
                      <span className="mt-0.5 inline-block rounded-full bg-emerald-600 px-1.5 py-px text-[0.65rem] font-semibold uppercase tracking-wide text-white dark:bg-emerald-500 dark:text-slate-950">
                        {t('balance.cashflow.salaryHistoryCurrent')}
                      </span>
                    ) : null}
                  </td>
                  <td
                    className={`whitespace-nowrap border-b px-3 py-2.5 text-right tabular-nums ${ui.divider} ${ui.heading} ${isLastRow ? 'border-b-0' : ''}`}
                  >
                    {formatMoney(item.monthlyNetSalary ?? 0)}
                  </td>
                  <td
                    className={`hidden whitespace-nowrap border-b px-3 py-2.5 sm:table-cell ${ui.divider} ${ui.textMuted} ${isLastRow ? 'border-b-0' : ''}`}
                  >
                    {formatPaysLabel(item, t)}
                  </td>
                  <td
                    className={`whitespace-nowrap border-b px-3 py-2.5 text-right tabular-nums font-medium ${ui.divider} ${ui.heading} ${isLastRow ? 'border-b-0' : ''}`}
                  >
                    {formatMoney(item.monthlyNetSalaryEffective ?? 0)}
                  </td>
                  <td
                    className={`border-b px-2 py-2.5 text-right ${ui.divider} ${isLastRow ? 'rounded-br-xl border-b-0' : ''}`}
                  >
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
