import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HorizontalScrollRegion,
  ScrollHintBanner,
} from '../../../components/HorizontalScrollRegion';
import { formatContributionGrowthLabel } from '../../../lib/contributionPlanLabels';
import {
  getPlanAnnualReturn,
  resolveLinkedAsset,
} from '../../../lib/contributionPlans';
import { ui } from '../../../lib/uiClasses';
import { formatMoney, formatPercent } from '../../../utils/formatters';

export function ContributionsTable({
  plans,
  assets,
  settings,
  onEdit,
  onDelete,
  onToggleActive,
}) {
  const { t } = useTranslation();
  const scrollRef = useRef(null);

  if (!plans.length) return null;

  return (
    <div className="space-y-2">
      <ScrollHintBanner
        hint={t('balance.contributions.tableScrollHint')}
        show={plans.length > 0}
      />
      <HorizontalScrollRegion
        ref={scrollRef}
        className={`w-full min-w-0 overflow-hidden rounded-xl border ${ui.divider}`}
      >
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <thead>
            <tr className={`border-b bg-slate-50/90 dark:bg-slate-800/50 ${ui.divider}`}>
              <th
                className="w-10 px-2 py-2.5"
                aria-label={t('balance.contributions.tableActive')}
              />
              <th
                className={`px-3 py-2.5 text-left text-xs font-semibold ${ui.textLabel}`}
              >
                {t('balance.contributions.tableDestination')}
              </th>
              <th
                className={`hidden px-3 py-2.5 text-left text-xs font-semibold sm:table-cell ${ui.textLabel}`}
              >
                {t('balance.contributions.tableCategory')}
              </th>
              <th
                className={`px-3 py-2.5 text-right text-xs font-semibold ${ui.textLabel}`}
              >
                {t('balance.contributions.tableAmount')}
              </th>
              <th
                className={`hidden px-3 py-2.5 text-right text-xs font-semibold md:table-cell ${ui.textLabel}`}
              >
                {t('balance.contributions.tableReturn')}
              </th>
              <th
                className={`hidden px-3 py-2.5 text-left text-xs font-semibold lg:table-cell ${ui.textLabel}`}
              >
                {t('balance.contributions.tableGrowth')}
              </th>
              <th className="w-28 px-2 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => {
              const inactive = !plan.isActive;
              const linkedAsset = resolveLinkedAsset(plan, assets);
              const assetMissing = plan.assetId && !linkedAsset;
              const planReturn = getPlanAnnualReturn(settings, plan, assets);

              return (
                <tr
                  key={plan.id}
                  className={`border-b last:border-b-0 ${ui.divider} ${
                    inactive ? 'opacity-55' : ''
                  }`}
                >
                  <td className="px-2 py-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={plan.isActive}
                      onChange={(e) => onToggleActive(plan.id, e.target.checked)}
                      aria-label={t('balance.contributions.active')}
                      className="h-4 w-4 rounded border-slate-400 text-emerald-500 focus:ring-emerald-500/40"
                    />
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
                    {formatMoney(plan.monthlyAmount ?? 0)}
                  </td>
                  <td
                    className={`hidden whitespace-nowrap px-3 py-2.5 text-right tabular-nums md:table-cell ${ui.textMuted}`}
                  >
                    {linkedAsset ? formatPercent(planReturn) : '—'}
                  </td>
                  <td
                    className={`hidden whitespace-nowrap px-3 py-2.5 lg:table-cell ${ui.textMuted}`}
                  >
                    {formatContributionGrowthLabel(
                      plan,
                      t,
                      formatMoney,
                      formatPercent,
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end sm:gap-3">
                      <button
                        type="button"
                        onClick={() => onEdit(plan)}
                        className={ui.actionLink}
                      >
                        {t('balance.contributions.editRow')}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(plan)}
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
      </HorizontalScrollRegion>
    </div>
  );
}
