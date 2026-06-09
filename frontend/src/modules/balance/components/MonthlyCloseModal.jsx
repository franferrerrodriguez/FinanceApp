import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppModal } from '../../../components/AppModal';
import { EffectiveMonthSelect } from '../../../components/EffectiveMonthSelect';
import { FormCheckboxField } from '../../../components/FormCheckboxField';
import { FormFieldFrame } from '../../../components/FormFieldFrame';
import { FormSection } from '../../../components/FormSection';
import { FormSectionHeader } from '../../../components/FormSectionHeader';
import { HelpTooltip } from '../../../components/HelpTooltip';
import { ModalFormFooter } from '../../../components/ModalFormFooter';
import { MoneyInput } from '../../../components/MoneyInput';
import { getEffectiveMortgageRent } from '../../../lib/calculations';
import { getCurrentMonthKey } from '../../../lib/dashboardMetrics';
import {
  getMortgageBalanceShareInfoFromTotal,
  getMortgageFullMonthlyPayment,
  isLinkedHousingMortgage,
  mortgageEnteredOutstandingTotal,
  mortgageOutstandingShareToTotal,
  mortgageOutstandingTotalToShare,
} from '../../../lib/housingLiability';
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
import { useFinanceData, usePreferences } from '../../../store/hooks';
import { formatInstitutionLabel } from '../../../lib/institutions';
import { formatMonthKeyLong, formatMonthKeyLabel, formatSnapshotDateLabel } from '../../../utils/monthLabel';
import {
  SPANISH_BANK_IDS,
  SPANISH_BANK_LEGACY_LABELS,
} from '../../../lib/spanishBanks';
import { ui } from '../../../lib/uiClasses';
import { formatMoney } from '../../../utils/formatters';

function CloseSection({ title, subtitle, children }) {
  return (
    <FormSection className="space-y-4">
      <FormSectionHeader title={title} hint={subtitle} />
      <ul className="divide-y divide-slate-200 dark:divide-slate-600/80">{children}</ul>
    </FormSection>
  );
}

function CloseBalanceRow({ name, meta, help, children, below }) {
  return (
    <li className="space-y-3 py-5 first:pt-0 last:pb-0">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <p className={`text-sm font-semibold ${ui.textLabel}`}>{name}</p>
          {help ? (
            <HelpTooltip ariaLabel={help}>{help}</HelpTooltip>
          ) : null}
        </div>
        {meta ? (
          <p className={`text-xs leading-relaxed ${ui.textMuted}`}>{meta}</p>
        ) : null}
      </div>
      <div className="w-full sm:max-w-[12rem]">{children}</div>
      {below ? (
        <div className={`space-y-3 border-t pt-4 ${ui.divider}`}>{below}</div>
      ) : null}
    </li>
  );
}

function GainLossField({ row, assetId, t, onChange }) {
  const breakdown = computeGainLossBreakdown(row.value, row.gainLossEuros);

  return (
    <div className="space-y-2">
      <FormCheckboxField
        id={`gain-toggle-${assetId}`}
        checked={row.showGainLoss}
        onChange={(checked) =>
          onChange(assetId, {
            showGainLoss: checked,
            gainLossEuros: checked ? row.gainLossEuros : null,
          })
        }
        label={t('balance.patrimony.closeGainLossToggle')}
        hint={row.showGainLoss ? t('balance.patrimony.closeGainLossHint') : undefined}
      />
      {row.showGainLoss ? (
        <div className="pl-8">
          <input
            id={`gain-${assetId}`}
            type="text"
            inputMode="decimal"
            aria-label={t('balance.patrimony.closeGainLossLabel')}
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
          {breakdown ? (
            <p className={`mt-1.5 text-xs leading-snug ${ui.textMuted}`}>
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
  const { updateLiability } = useFinanceData();
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
    setLiabilityRows(
      initial.liabilityRows.map((row) => {
        const liability = activeLiabilities.find((l) => l.id === row.liabilityId);
        if (!liability || row.value == null) return row;
        if (!isLinkedHousingMortgage(liability, settings, liabilities)) return row;
        return {
          ...row,
          value: mortgageOutstandingShareToTotal(settings, liability, row.value),
        };
      }),
    );
  }, [open, initial, activeLiabilities, settings, liabilities]);

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
    const liabilityRowsForSnapshot = liabilityRows.map((row) => {
      const liability = activeLiabilities.find((l) => l.id === row.liabilityId);
      if (!liability || row.value == null) return row;
      return {
        ...row,
        value: mortgageOutstandingTotalToShare(settings, liability, row.value),
      };
    });
    for (const row of liabilityRows) {
      if (row.value == null) continue;
      const liability = activeLiabilities.find((l) => l.id === row.liabilityId);
      if (!liability || !isLinkedHousingMortgage(liability, settings, liabilities)) {
        continue;
      }
      updateLiability(liability.id, {
        enteredOutstandingTotal: mortgageEnteredOutstandingTotal(row.value),
      });
    }

    const snaps = buildCloseMonthSnapshots({
      assetRows,
      liabilityRows: liabilityRowsForSnapshot,
      snapshotDate: initial.snapshotDate,
      existingSnapshots: snapshots,
    });
    onConfirm(resolvedMonthKey, snaps);
    onClose();
  };

  const renderAssetRow = (asset) => {
    const row = assetRows.find((r) => r.assetId === asset.id);
    if (!row) return null;
    const preview =
      row.modified &&
      deriveContributionPreviewForAsset({
        snapshots,
        assets,
        settings,
        monthKey: resolvedMonthKey,
        assetId: asset.id,
        newBalance: row.value ?? 0,
      });
    const isPrefilled =
      !row.modified && row.prefillSource === 'previous' && row.prefillMonthKey;
    const tracksGainLoss = assetTracksGainLoss(asset);

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

    const below = [];
    if (preview) {
      below.push(
        <p key="preview" className={`text-xs leading-snug ${ui.textMuted}`}>
          {t('balance.patrimony.derivedContributionHint', {
            delta: formatMoney(preview.delta),
            contribution: formatMoney(preview.amount),
            returnAmount: formatMoney(preview.estimatedReturn),
          })}
        </p>,
      );
    }
    if (tracksGainLoss) {
      below.push(
        <GainLossField
          key="gain"
          row={row}
          assetId={asset.id}
          t={t}
          onChange={updateAssetRow}
        />,
      );
    }

    return (
      <CloseBalanceRow
        key={asset.id}
        name={asset.name}
        meta={meta}
        below={below.length ? below : null}
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
    const fullMortgagePayment = housing
      ? getMortgageFullMonthlyPayment(settings, liability)
      : 0;
    const monthlyDrop =
      housing && prevBalance != null
        ? estimateMortgageMonthlyDrop(
            {
              ...liability,
              monthlyPayment: fullMortgagePayment,
            },
            prevBalance,
          )
        : null;

    let meta;
    let help;
    if (housing) {
      const shared = settings?.mortgageRentShared;
      const rowValue = row.value != null ? Number(row.value) : null;
      const sharePreview =
        shared && rowValue != null
          ? getMortgageBalanceShareInfoFromTotal(settings, liability, rowValue)
          : null;

      meta =
        prevBalance != null && monthlyDrop != null
          ? t('balance.patrimony.closeMortgagePrevHint', {
              prev: formatMoney(prevBalance),
              drop: formatMoney(monthlyDrop),
            })
          : shared
            ? t('balance.patrimony.closeHousingMortgageSharedShort')
            : t('balance.patrimony.closeHousingMortgageShort');
      if (sharePreview) {
        meta = t('balance.patrimony.closeHousingMortgageSharePreview', {
          share: formatMoney(sharePreview.yourShare),
          percent: sharePreview.percent,
        });
      }
      help = [
        monthlyMortgagePayment > 0
          ? t('balance.patrimony.closeHousingMortgageQuota', {
              payment: formatMoney(monthlyMortgagePayment),
            })
          : t('balance.patrimony.closeHousingMortgageQuotaMissing'),
        shared
          ? t('balance.patrimony.closeHousingMortgageSharedHint')
          : t('balance.patrimony.closeHousingMortgageHint'),
      ].join(' ');
    } else {
      meta = t(`categories.liability.${liability.category}`);
    }

    return (
      <CloseBalanceRow
        key={liability.id}
        name={
          housing
            ? t('balance.patrimony.closeHousingMortgageTitle')
            : liability.name
        }
        meta={meta}
        help={help}
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
        <FormSection className="mb-2">
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
        </FormSection>
      ) : null}

      {activeAssets.length === 0 && activeLiabilities.length === 0 ? (
        <p className={`text-sm ${ui.text}`}>{t('balance.patrimony.closeEmpty')}</p>
      ) : (
        <div className="space-y-8">
          {quickSaveAvailable ? (
            <button
              type="button"
              className={`w-full rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-4 text-left text-sm font-medium text-emerald-800 transition hover:bg-emerald-500/15 dark:text-emerald-200`}
              onClick={handleSubmit}
            >
              {t('balance.patrimony.closeQuickSaveSame')}
            </button>
          ) : null}

          {liquidity.length > 0 ? (
            <CloseSection title={t('balance.patrimony.closeGroupLiquidity')}>
              {liquidity.map((asset) => renderAssetRow(asset))}
            </CloseSection>
          ) : null}

          {investments.length > 0 ? (
            <CloseSection
              title={t('balance.patrimony.closeGroupInvestments', {
                total: formatMoney(investmentGroupTotal),
              })}
              subtitle={t('balance.patrimony.closeGroupInvestmentsHint')}
            >
              {investments.map((asset) => renderAssetRow(asset))}
            </CloseSection>
          ) : null}

          {activeLiabilities.length > 0 ? (
            <CloseSection
              title={t('balance.patrimony.closeGroupDebts', {
                total: formatMoney(liabilitiesGroupTotal),
              })}
              subtitle={t('balance.patrimony.closeGroupDebtsHint')}
            >
              {housingMortgage
                ? renderLiabilityRow(housingMortgage, { housing: true })
                : null}
              {otherLiabilities.map((liability) =>
                renderLiabilityRow(liability),
              )}
            </CloseSection>
          ) : null}

          {previousNetWorth != null || canSubmit ? (
            <FormSection className="space-y-2">
              {previousNetWorth != null ? (
                <p className={`text-sm ${ui.textMuted}`}>
                  {t('balance.patrimony.closeSummaryPrev', {
                    amount: formatMoney(previousNetWorth),
                  })}
                </p>
              ) : null}
              {canSubmit ? (
                <p className={`text-base font-semibold ${ui.textLabel}`}>
                  {previousNetWorth != null
                    ? t('balance.patrimony.closeSummaryNew', {
                        amount: formatMoney(newNetWorth),
                      })
                    : t('balance.patrimony.closeSummaryNewOnly', {
                        amount: formatMoney(newNetWorth),
                      })}
                </p>
              ) : null}
              {canSubmit && netWorthDelta != null ? (
                netWorthDelta === 0 ? (
                  <p className={`text-sm ${ui.textMuted}`}>
                    {t('balance.patrimony.closeSummaryNoChange')}
                  </p>
                ) : (
                  <p
                    className={`text-sm font-semibold ${
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
            </FormSection>
          ) : null}
        </div>
      )}
    </AppModal>
  );
}
