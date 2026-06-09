import { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppModal } from '../../../components/AppModal';
import { EffectiveMonthSelect } from '../../../components/EffectiveMonthSelect';
import { FormFieldFrame } from '../../../components/FormFieldFrame';
import { ModalFormFooter } from '../../../components/ModalFormFooter';
import { MoneyInput } from '../../../components/MoneyInput';
import { getEffectiveMortgageRent } from '../../../lib/calculations';
import { getCurrentMonthKey } from '../../../lib/dashboardMetrics';
import { isLinkedHousingMortgage } from '../../../lib/housingLiability';
import {
  getCloseableAssets,
  getCloseableLiabilities,
  getMonthlyCloseMonthOptions,
} from '../../../lib/monthlyClose';
import { deriveContributionPreviewForAsset } from '../../../lib/deriveContributionsFromSnapshots';
import {
  buildCloseMonthSnapshots,
  buildMonthlyCloseDrafts,
} from '../../../lib/patrimony';
import {
  assetTracksGainLoss,
  CLOSE_ASSET_GROUP,
  allCloseRowsFilled,
  canQuickSaveAllSame,
  computeDraftNetWorth,
  computeGainLossBreakdown,
  estimateMortgageMonthlyDrop,
  getReferenceMonthNetWorth,
  groupActiveAssetsForClose,
  sumDraftGroupAssets,
  sumDraftLiabilities,
} from '../../../lib/monthlyCloseForm';
import { parseSignedMoneyEuros } from '../../../lib/money';
import { usePreferences } from '../../../store/hooks';
import { formatInstitutionLabel } from '../../../lib/institutions';
import { formatMonthKeyLong, formatMonthKeyLabel, formatSnapshotDateLabel } from '../../../utils/monthLabel';
import {
  SPANISH_BANK_IDS,
  SPANISH_BANK_LEGACY_LABELS,
} from '../../../lib/spanishBanks';
import { ui } from '../../../lib/uiClasses';
import { formatMoney } from '../../../utils/formatters';

function CollapsibleGroup({ title, subtitle, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section>
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 rounded-lg px-1 py-2 text-left transition hover:bg-slate-50/90 dark:hover:bg-slate-800/40"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="min-w-0">
          <h3 className={`text-sm font-semibold ${ui.heading}`}>{title}</h3>
          {subtitle ? (
            <p className={`${ui.formFieldHint} ${ui.textMuted} ${ui.formFieldHintGap}`}>
              {subtitle}
            </p>
          ) : null}
        </div>
        <ChevronDown
          className={`mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open ? (
        <ul className={`mt-1 divide-y border-t ${ui.divider}`}>{children}</ul>
      ) : null}
    </section>
  );
}

function CloseBalanceRow({ name, meta, children, below, accent = false }) {
  return (
    <li
      className={`py-3.5 ${accent ? 'border-l-2 border-amber-500/50 pl-3' : ''}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 sm:pt-2">
          <p className={`${ui.formFieldLabel} ${ui.textLabel}`}>{name}</p>
          {meta ? (
            <p className={`${ui.formFieldHint} ${ui.textMuted} ${ui.formFieldHintGap}`}>
              {meta}
            </p>
          ) : null}
        </div>
        <div className="w-full shrink-0 sm:w-[9.5rem]">{children}</div>
      </div>
      {below ? <div className="mt-3">{below}</div> : null}
    </li>
  );
}

function GainLossField({ row, assetId, t, onChange }) {
  const breakdown = computeGainLossBreakdown(row.value, row.gainLossEuros);

  return (
    <div className="mt-3 border-t border-dashed border-slate-200 pt-3 dark:border-slate-700">
      <label className="flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          className={ui.checkbox}
          checked={row.showGainLoss}
          onChange={(e) =>
            onChange(assetId, {
              showGainLoss: e.target.checked,
              gainLossEuros: e.target.checked ? row.gainLossEuros : null,
            })
          }
        />
        <span className={`text-xs leading-snug ${ui.textLabel}`}>
          {t('balance.patrimony.closeGainLossToggle')}
        </span>
      </label>
      {row.showGainLoss ? (
        <div className="space-y-2 pl-7">
          <label className={`block text-xs font-medium ${ui.textLabel}`} htmlFor={`gain-${assetId}`}>
            {t('balance.patrimony.closeGainLossLabel')}
          </label>
          <input
            id={`gain-${assetId}`}
            type="text"
            inputMode="decimal"
            placeholder={t('balance.patrimony.closeGainLossPlaceholder')}
            value={row.gainLossEuros == null ? '' : String(row.gainLossEuros)}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d.,+-]/g, '');
              onChange(assetId, {
                gainLossEuros: raw === '' ? null : parseSignedMoneyEuros(raw),
              });
            }}
            className={`${ui.input} w-full max-w-none text-sm`}
          />
          <p className={`text-[11px] leading-relaxed ${ui.textMuted}`}>
            {t('balance.patrimony.closeGainLossHint')}
          </p>
          {breakdown ? (
            <p className={`text-xs leading-relaxed ${ui.textMuted}`}>
              {t('balance.patrimony.closeGainLossBreakdown', {
                contributed: formatMoney(breakdown.contributed),
                market: formatMoney(breakdown.gain),
                pct:
                  breakdown.pct == null
                    ? '—'
                    : `${breakdown.pct >= 0 ? '+' : ''}${breakdown.pct.toFixed(1)}%`,
              })}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function MonthlyCloseModal({
  open,
  onClose,
  assets,
  liabilities,
  snapshots,
  settings,
  onConfirm,
  monthKey,
  onMonthKeyChange,
}) {
  const { t } = useTranslation();
  const { locale } = usePreferences();
  const activeAssets = getCloseableAssets(assets);
  const activeLiabilities = getCloseableLiabilities(liabilities);
  const currentMonthKey = getCurrentMonthKey();

  const monthOptions = useMemo(
    () =>
      getMonthlyCloseMonthOptions(snapshots, assets, liabilities, { locale }),
    [snapshots, assets, liabilities, locale],
  );

  const resolvedMonthKey =
    monthKey && monthOptions.some((o) => o.monthKey === monthKey)
      ? monthKey
      : (monthOptions[0]?.monthKey ?? currentMonthKey);

  const selectedOption = monthOptions.find((o) => o.monthKey === resolvedMonthKey);
  const isCurrentMonth = resolvedMonthKey === currentMonthKey;

  const initial = useMemo(
    () =>
      buildMonthlyCloseDrafts({
        assets,
        liabilities,
        snapshots,
        monthKey: resolvedMonthKey,
      }),
    [assets, liabilities, snapshots, resolvedMonthKey, open],
  );

  const [assetRows, setAssetRows] = useState(initial.assetRows);
  const [liabilityRows, setLiabilityRows] = useState(initial.liabilityRows);

  useEffect(() => {
    if (!open) return;
    setAssetRows(initial.assetRows);
    setLiabilityRows(initial.liabilityRows);
  }, [open, initial]);

  const { liquidity, investments } = useMemo(
    () => groupActiveAssetsForClose(assets),
    [assets],
  );

  const housingMortgage = activeLiabilities.find((l) =>
    isLinkedHousingMortgage(l, settings, liabilities),
  );
  const otherLiabilities = activeLiabilities.filter(
    (l) => !isLinkedHousingMortgage(l, settings, liabilities),
  );
  const monthlyMortgagePayment = getEffectiveMortgageRent(settings ?? {});

  const previousNetWorth = useMemo(
    () =>
      getReferenceMonthNetWorth(
        snapshots,
        assets,
        liabilities,
        resolvedMonthKey,
      ),
    [snapshots, assets, liabilities, resolvedMonthKey],
  );

  const newNetWorth = useMemo(
    () => computeDraftNetWorth(assetRows, liabilityRows),
    [assetRows, liabilityRows],
  );

  const netWorthDelta =
    previousNetWorth != null ? newNetWorth - previousNetWorth : null;

  const quickSaveAvailable = canQuickSaveAllSame(assetRows, liabilityRows);
  const canSubmit = allCloseRowsFilled(assetRows, liabilityRows);
  const isUpdate = selectedOption?.hasClose;
  const snapshotDateLabel = formatSnapshotDateLabel(initial.snapshotDate, locale);

  const investmentGroupTotal = sumDraftGroupAssets(
    assetRows,
    assets,
    CLOSE_ASSET_GROUP.INVESTMENTS,
  );
  const liabilitiesGroupTotal = sumDraftLiabilities(liabilityRows);

  const updateAssetRow = (assetId, patch) => {
    setAssetRows((prev) =>
      prev.map((r) => {
        if (r.assetId !== assetId) return r;
        const next = { ...r, ...patch };
        if (patch.value !== undefined) next.modified = true;
        return next;
      }),
    );
  };

  const updateLiabilityRow = (liabilityId, patch) => {
    setLiabilityRows((prev) =>
      prev.map((r) => {
        if (r.liabilityId !== liabilityId) return r;
        const next = { ...r, ...patch };
        if (patch.value !== undefined) next.modified = true;
        return next;
      }),
    );
  };

  const prefillHint = (row) => {
    if (row.modified || row.prefillSource !== 'previous' || !row.prefillMonthKey) {
      return undefined;
    }
    return t('balance.patrimony.closePrefillHint', {
      month: formatMonthKeyLabel(row.prefillMonthKey, locale),
    });
  };

  const handleSubmit = () => {
    const snaps = buildCloseMonthSnapshots({
      assetRows,
      liabilityRows,
      snapshotDate: initial.snapshotDate,
      existingSnapshots: snapshots,
    });
    onConfirm(resolvedMonthKey, snaps);
    onClose();
  };

  const renderAssetRow = (asset) => {
    const row = assetRows.find((r) => r.assetId === asset.id);
    if (!row) return null;
    const preview = deriveContributionPreviewForAsset({
      snapshots,
      assets,
      settings,
      monthKey: resolvedMonthKey,
      assetId: asset.id,
      newBalance: row.value ?? 0,
    });
    const isPrefilled =
      !row.modified && row.prefillSource === 'previous' && row.prefillMonthKey;

    const meta = [
      t(`categories.asset.${asset.category}`),
      asset.provider
        ? formatInstitutionLabel(
            asset.provider,
            SPANISH_BANK_IDS,
            t,
            'balance.banks',
            SPANISH_BANK_LEGACY_LABELS,
          )
        : null,
    ]
      .filter(Boolean)
      .join(' · ');

    const below = (
      <>
        {preview ? (
          <p className={`${ui.formFieldHint} leading-relaxed ${ui.textMuted}`}>
            {t('balance.patrimony.derivedContributionHint', {
              delta: formatMoney(preview.delta),
              contribution: formatMoney(preview.amount),
              returnAmount: formatMoney(preview.estimatedReturn),
            })}
          </p>
        ) : null}
        {assetTracksGainLoss(asset) ? (
          <GainLossField
            row={row}
            assetId={asset.id}
            t={t}
            onChange={updateAssetRow}
          />
        ) : null}
      </>
    );

    return (
      <CloseBalanceRow
        key={asset.id}
        name={asset.name}
        meta={meta}
        below={preview || assetTracksGainLoss(asset) ? below : null}
      >
        <MoneyInput
          id={`close-asset-${asset.id}`}
          aria-label={t('balance.patrimony.value')}
          value={row.value}
          fullWidth
          prefilled={Boolean(isPrefilled)}
          hint={prefillHint(row)}
          onChange={(value) => updateAssetRow(asset.id, { value })}
        />
      </CloseBalanceRow>
    );
  };

  const renderLiabilityRow = (liability, { housing = false } = {}) => {
    const row = liabilityRows.find((r) => r.liabilityId === liability.id);
    if (!row) return null;
    const isPrefilled =
      !row.modified && row.prefillSource === 'previous' && row.prefillMonthKey;
    const prevBalance = row.prefillSource === 'previous' ? row.value : null;
    const monthlyDrop =
      housing && prevBalance != null
        ? estimateMortgageMonthlyDrop(liability, prevBalance)
        : null;

    const meta = housing
      ? [
          monthlyMortgagePayment > 0
            ? t('balance.patrimony.closeHousingMortgageQuota', {
                payment: formatMoney(monthlyMortgagePayment),
              })
            : t('balance.patrimony.closeHousingMortgageQuotaMissing'),
          prevBalance != null && monthlyDrop != null
            ? t('balance.patrimony.closeMortgagePrevHint', {
                prev: formatMoney(prevBalance),
                drop: formatMoney(monthlyDrop),
              })
            : t('balance.patrimony.closeHousingMortgageHint'),
        ].join(' · ')
      : t(`categories.liability.${liability.category}`);

    return (
      <CloseBalanceRow
        key={liability.id}
        name={
          housing
            ? t('balance.patrimony.closeHousingMortgageTitle')
            : liability.name
        }
        meta={meta}
        accent={housing}
      >
        <MoneyInput
          id={`close-liability-${liability.id}`}
          aria-label={t('balance.patrimony.debtValue')}
          value={row.value}
          fullWidth
          prefilled={Boolean(isPrefilled)}
          hint={prefillHint(row)}
          onChange={(value) => updateLiabilityRow(liability.id, { value })}
        />
      </CloseBalanceRow>
    );
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={t('balance.patrimony.recordBalancesTitle')}
      subtitle={
        isUpdate
          ? t('balance.patrimony.recordBalancesUpdateSubtitle', {
              month: formatMonthKeyLong(resolvedMonthKey, locale),
            })
          : t('balance.patrimony.recordBalancesSubtitle', {
              month: formatMonthKeyLong(resolvedMonthKey, locale),
              date: snapshotDateLabel,
            })
      }
      footer={
        <ModalFormFooter
          onCancel={onClose}
          onSave={handleSubmit}
          canSave={canSubmit}
          saveLabel={t('balance.patrimony.recordBalancesConfirm')}
        />
      }
    >
      {monthOptions.length > 0 ? (
        <FormFieldFrame
          label={t('balance.patrimony.recordBalancesMonth')}
          hint={
            selectedOption
              ? `${selectedOption.hasClose ? t('balance.patrimony.recordBalancesMonthClosed') : t('balance.patrimony.recordBalancesMonthPending')}${
                  isCurrentMonth
                    ? ` · ${t('balance.patrimony.recordBalancesCurrentMonthHint')}`
                    : ''
                }`
              : undefined
          }
          reserveHintSpace={false}
          className="mb-5"
        >
          <EffectiveMonthSelect
            id="record-balances-month"
            value={resolvedMonthKey}
            extraMonthKeys={monthOptions.map((o) => o.monthKey)}
            lookbackMonths={48}
            onChange={(mk) => onMonthKeyChange?.(mk)}
            ariaLabel={t('balance.patrimony.recordBalancesMonth')}
          />
        </FormFieldFrame>
      ) : null}

      {activeAssets.length === 0 && activeLiabilities.length === 0 ? (
        <p className={`text-sm ${ui.text}`}>{t('balance.patrimony.closeEmpty')}</p>
      ) : (
        <div className="space-y-6">
          {quickSaveAvailable ? (
            <button
              type="button"
              className={`w-full rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-left text-sm font-medium text-emerald-900 transition hover:bg-emerald-500/15 dark:text-emerald-100`}
              onClick={handleSubmit}
            >
              {t('balance.patrimony.closeQuickSaveSame')}
            </button>
          ) : null}

          <div className={`space-y-5 border-t pt-5 ${ui.divider}`}>
            {liquidity.length > 0 ? (
              <CollapsibleGroup
                title={t('balance.patrimony.closeGroupLiquidity')}
                defaultOpen
              >
                {liquidity.map((asset) => renderAssetRow(asset))}
              </CollapsibleGroup>
            ) : null}

            {investments.length > 0 ? (
              <CollapsibleGroup
                title={t('balance.patrimony.closeGroupInvestments', {
                  total: formatMoney(investmentGroupTotal),
                })}
                subtitle={t('balance.patrimony.closeGroupInvestmentsHint')}
                defaultOpen={false}
              >
                {investments.map((asset) => renderAssetRow(asset))}
              </CollapsibleGroup>
            ) : null}

            {activeLiabilities.length > 0 ? (
              <CollapsibleGroup
                title={t('balance.patrimony.closeGroupDebts', {
                  total: formatMoney(liabilitiesGroupTotal),
                })}
                subtitle={t('balance.patrimony.closeGroupDebtsHint')}
                defaultOpen={false}
              >
                {housingMortgage
                  ? renderLiabilityRow(housingMortgage, { housing: true })
                  : null}
                {otherLiabilities.map((liability) =>
                  renderLiabilityRow(liability),
                )}
              </CollapsibleGroup>
            ) : null}
          </div>

          {previousNetWorth != null || canSubmit ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm dark:bg-emerald-950/20">
              {previousNetWorth != null ? (
                <>
                  <p className={ui.textLabel}>
                    {t('balance.patrimony.closeSummaryPrev', {
                      amount: formatMoney(previousNetWorth),
                    })}
                  </p>
                  {canSubmit ? (
                    <p className={`mt-1 ${ui.textLabel}`}>
                      {t('balance.patrimony.closeSummaryNew', {
                        amount: formatMoney(newNetWorth),
                      })}
                    </p>
                  ) : null}
                  {canSubmit && netWorthDelta != null ? (
                    netWorthDelta === 0 ? (
                      <p className={`mt-1 text-xs ${ui.textMuted}`}>
                        {t('balance.patrimony.closeSummaryNoChange')}
                      </p>
                    ) : (
                      <p
                        className={`mt-1 font-semibold ${
                          netWorthDelta > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {t('balance.patrimony.closeSummaryDelta', {
                          amount: formatMoney(Math.abs(netWorthDelta)),
                          sign: netWorthDelta > 0 ? '↑' : '↓',
                        })}
                      </p>
                    )
                  ) : null}
                </>
              ) : (
                canSubmit && (
                  <p className={ui.textLabel}>
                    {t('balance.patrimony.closeSummaryNewOnly', {
                      amount: formatMoney(newNetWorth),
                    })}
                  </p>
                )
              )}
            </div>
          ) : null}
        </div>
      )}
    </AppModal>
  );
}
