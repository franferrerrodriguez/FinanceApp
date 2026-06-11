import { Fragment, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HorizontalScrollRegion,
  ScrollHintBanner,
} from '../../../components/HorizontalScrollRegion';
import { getKpiValueClass } from '../../../components/KpiCard';
import { getAssetAnnualReturn } from '../../../lib/projectionReturns';
import { ui } from '../../../lib/uiClasses';
import { formatMoney, formatRatePercent } from '../../../utils/formatters';

function TableMetricCell({ primary, subtext, className = '' }) {
  return (
    <td className={`px-3 py-2.5 text-right tabular-nums ${className}`.trim()}>
      <span className="block whitespace-nowrap">{primary}</span>
      {subtext ? (
        <span className={`mt-0.5 block text-xs font-normal ${ui.textMuted}`}>
          {subtext}
        </span>
      ) : null}
    </td>
  );
}

export function PatrimonyCatalogTable({
  items,
  kind,
  categoryLabel,
  providerLabel,
  getPaymentSubtext,
  getBalance,
  getBalanceSubtext,
  settings,
  onEdit,
  onDelete,
  canDeleteItem,
  renderAfterRow,
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
                <>
                  <th
                    className={`hidden px-3 py-2.5 text-right text-xs font-semibold sm:table-cell ${ui.textLabel}`}
                  >
                    {t('balance.patrimony.tableInterestRate')}
                  </th>
                  <th
                    className={`hidden px-3 py-2.5 text-right text-xs font-semibold sm:table-cell ${ui.textLabel}`}
                  >
                    {t('balance.patrimony.tablePayment')}
                  </th>
                </>
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
                <Fragment key={item.id}>
                <tr
                  className={`border-b last:border-b-0 ${ui.divider} ${
                    inactive ? 'opacity-55' : ''
                  }`}
                >
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
                      {formatRatePercent(getAssetAnnualReturn(settings, item))}
                    </td>
                  ) : null}
                  {kind === 'liability' ? (
                    <>
                      <td
                        className={`hidden whitespace-nowrap px-3 py-2.5 text-right tabular-nums sm:table-cell ${ui.textMuted}`}
                        title={t('balance.patrimony.tableInterestRateHint')}
                      >
                        {formatRatePercent(item.interestRate ?? 0)}
                      </td>
                      <TableMetricCell
                        className={`hidden sm:table-cell ${ui.textLabel}`}
                        primary={providerLabel?.(item)}
                        subtext={getPaymentSubtext?.(item)}
                      />
                    </>
                  ) : null}
                  {getBalance ? (
                    <TableMetricCell
                      className={
                        kind === 'liability'
                          ? getKpiValueClass('liability')
                          : getKpiValueClass('assets')
                      }
                      primary={(() => {
                        const balance = getBalance(item);
                        return balance != null ? formatMoney(balance) : '—';
                      })()}
                      subtext={getBalanceSubtext?.(item)}
                    />
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
                      {onDelete && (canDeleteItem?.(item) ?? true) ? (
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
                {renderAfterRow?.(item)}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </HorizontalScrollRegion>
    </div>
  );
}
