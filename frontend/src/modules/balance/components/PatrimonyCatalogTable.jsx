import { Fragment, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HorizontalScrollRegion,
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

function MobileItemCard({
  item,
  kind,
  categoryLabel,
  getMobilePaymentInfo,
  getBalance,
  getBalanceSubtext,
  settings,
  onEdit,
  onDelete,
  canDeleteItem,
  t,
}) {
  const inactive = item.isActive === false;
  const balance = getBalance?.(item);
  const balanceClass =
    kind === 'liability' ? getKpiValueClass('liability') : getKpiValueClass('assets');
  const paymentInfo = getMobilePaymentInfo?.(item);

  return (
    <div
      className={`${ui.block} space-y-2 px-4 py-3 ${inactive ? 'opacity-55' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={`font-semibold ${ui.heading}`}>{item.name}</p>
          {item.notes ? (
            <p className={`text-xs ${ui.textMuted}`}>{item.notes}</p>
          ) : null}
        </div>
        {balance != null ? (
          <div className="shrink-0 text-right tabular-nums">
            <p className={`font-semibold ${balanceClass}`}>{formatMoney(balance)}</p>
            {getBalanceSubtext?.(item) ? (
              <p className={`text-xs ${ui.textMuted}`}>{getBalanceSubtext(item)}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className={`text-xs ${ui.textMuted}`}>
          {categoryLabel(item.category)}
          {kind === 'asset' ? (
            <span>{' · '}{formatRatePercent(getAssetAnnualReturn(settings, item))}</span>
          ) : null}
          {kind === 'liability' ? (
            <span>{' · TIN '}{formatRatePercent(item.interestRate ?? 0)}</span>
          ) : null}
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <button type="button" onClick={() => onEdit(item)} className={ui.actionLink}>
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
      </div>

      {paymentInfo ? (
        <p className={`text-xs ${ui.textMuted}`}>{paymentInfo}</p>
      ) : null}
    </div>
  );
}

export function PatrimonyCatalogTable({
  items,
  kind,
  categoryLabel,
  providerLabel,
  getPaymentSubtext,
  getMobilePaymentInfo,
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
      {/* Mobile: card layout — all info visible, no scroll */}
      <div className="space-y-2 sm:hidden">
        {items.map((item) => (
          <Fragment key={item.id}>
            <MobileItemCard
              item={item}
              kind={kind}
              categoryLabel={categoryLabel}
              getMobilePaymentInfo={getMobilePaymentInfo}
              getBalance={getBalance}
              getBalanceSubtext={getBalanceSubtext}
              settings={settings}
              onEdit={onEdit}
              onDelete={onDelete}
              canDeleteItem={canDeleteItem}
              t={t}
            />
            {renderAfterRow?.(item)}
          </Fragment>
        ))}
      </div>

      {/* Desktop: full table */}
      <HorizontalScrollRegion
        ref={scrollRef}
        className={`hidden w-full min-w-0 overflow-hidden rounded-xl border sm:block ${ui.divider}`}
      >
        <table className="w-full min-w-[36rem] border-collapse text-sm">
          <thead>
            <tr className={`border-b bg-[rgba(255,255,255,0.03)] ${ui.divider}`}>
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
                  className={`px-3 py-2.5 text-right text-xs font-semibold ${ui.textLabel}`}
                >
                  {t('balance.patrimony.tableReturn')}
                </th>
              ) : null}
              {kind === 'liability' ? (
                <>
                  <th
                    className={`px-3 py-2.5 text-right text-xs font-semibold ${ui.textLabel}`}
                  >
                    {t('balance.patrimony.tableInterestRate')}
                  </th>
                  <th
                    className={`px-3 py-2.5 text-right text-xs font-semibold ${ui.textLabel}`}
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
                        className={`whitespace-nowrap px-3 py-2.5 text-right tabular-nums ${ui.textMuted}`}
                        title={t('balance.patrimony.tableReturnAssetHint')}
                      >
                        {formatRatePercent(getAssetAnnualReturn(settings, item))}
                      </td>
                    ) : null}
                    {kind === 'liability' ? (
                      <>
                        <td
                          className={`whitespace-nowrap px-3 py-2.5 text-right tabular-nums ${ui.textMuted}`}
                          title={t('balance.patrimony.tableInterestRateHint')}
                        >
                          {formatRatePercent(item.interestRate ?? 0)}
                        </td>
                        <TableMetricCell
                          className={ui.textLabel}
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
                      <div className="flex flex-row items-center justify-end gap-3">
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
