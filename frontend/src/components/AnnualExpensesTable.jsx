import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ui } from '../lib/uiClasses';
import { formatMoney } from '../utils/formatters';
import {
  HorizontalScrollRegion,
  ScrollHintBanner,
} from './HorizontalScrollRegion';

export function AnnualExpensesTable({ items, onEdit, onDelete }) {
  const { t } = useTranslation();
  const scrollRef = useRef(null);

  if (!items.length) return null;

  return (
    <div className="space-y-2">
      <ScrollHintBanner
        hint={t('balance.cashflow.annualExpenseTableScrollHint')}
        show={items.length > 0}
      />
      <HorizontalScrollRegion
        ref={scrollRef}
        className={`w-full min-w-0 overflow-hidden rounded-xl border ${ui.divider}`}
      >
        <table className="w-full min-w-[28rem] border-collapse text-sm">
          <thead>
            <tr className={`border-b bg-slate-50/90 dark:bg-slate-800/50 ${ui.divider}`}>
              <th
                className={`px-3 py-2.5 text-left text-xs font-semibold ${ui.textLabel}`}
              >
                {t('balance.cashflow.annualExpenseTableName')}
              </th>
              <th
                className={`px-3 py-2.5 text-right text-xs font-semibold ${ui.textLabel}`}
              >
                {t('balance.cashflow.annualExpenseTableAmount')}
              </th>
              <th
                className={`px-3 py-2.5 text-left text-xs font-semibold ${ui.textLabel}`}
              >
                {t('balance.cashflow.annualExpenseTableMonth')}
              </th>
              <th className="w-28 px-2 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const name = (item.name ?? '').trim();

              return (
                <tr
                  key={item.id}
                  className={`border-b last:border-b-0 ${ui.divider}`}
                >
                  <td className={`max-w-[12rem] px-3 py-2.5 font-medium ${ui.heading}`}>
                    <span className="block truncate">
                      {name || t('balance.cashflow.annualExpenseUntitled')}
                    </span>
                  </td>
                  <td
                    className={`whitespace-nowrap px-3 py-2.5 text-right tabular-nums ${ui.heading}`}
                  >
                    {formatMoney(item.amount ?? 0)}
                  </td>
                  <td className={`whitespace-nowrap px-3 py-2.5 ${ui.textLabel}`}>
                    {t(`common.months.${item.month ?? 1}`)}
                  </td>
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
