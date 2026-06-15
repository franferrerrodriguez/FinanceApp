import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppModal } from '../../../components/AppModal';
import { EffectiveMonthSelect } from '../../../components/EffectiveMonthSelect';
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
  getMissingCloseItemsForMonth,
  getMonthlyCloseMonthOptions,
} from '../../../lib/monthlyClose';
import { deriveContributionPreviewForAsset } from '../../../lib/deriveContributionsFromSnapshots';
import {
  buildCloseMonthSnapshots,
  buildMonthlyCloseDrafts,
} from '../../../lib/patrimony';
import {
  CLOSE_ASSET_GROUP,
  allCloseRowsFilled,
  canQuickSaveAllSame,
  computeDraftNetWorth,
  estimateMortgageMonthlyDrop,
  fillEmptyCloseRows,
  getReferenceMonthNetWorth,
  groupActiveAssetsForClose,
  hasEmptyCloseRows,
  isInvestmentAssetCategory,
  sumDraftGroupAssets,
  sumDraftLiabilities,
} from '../../../lib/monthlyCloseForm';
import { useFinanceData, usePreferences } from '../../../store/hooks';
import { formatInstitutionLabel } from '../../../lib/institutions';
import { formatConjunctionList } from '../../../utils/listLabel';
import { formatMonthKeyLong, formatMonthKeyLabel } from '../../../utils/monthLabel';
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
      <ul className="divide-y divide-[rgba(255,255,255,0.08)]">{children}</ul>
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
  const activeAssets = useMemo(() => getCloseableAssets(assets), [assets]);
  const activeLiabilities = useMemo(
    () => getCloseableLiabilities(liabilities),
    [liabilities],
  );
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
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowEmptyConfirm(false);
      return;
    }
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
  const emptyRowsRemain = hasEmptyCloseRows(assetRows, liabilityRows);
  const canSubmit = allCloseRowsFilled(assetRows, liabilityRows);
  const emptyFieldCount = useMemo(
    () =>
      [...assetRows, ...liabilityRows].filter(
        (r) => r.value == null || !Number.isFinite(Number(r.value)),
      ).length,
    [assetRows, liabilityRows],
  );
  const canSaveDraft =
    activeAssets.length > 0 || activeLiabilities.length > 0;

  const missingForMonth = useMemo(
    () =>
      getMissingCloseItemsForMonth(
        snapshots,
        assets,
        liabilities,
        resolvedMonthKey,
      ),
    [snapshots, assets, liabilities, resolvedMonthKey],
  );

  const modalSubtitle = useMemo(() => {
    if (missingForMonth.length === 0) return undefined;
    return t('balance.patrimony.recordBalancesPendingSubtitle', {
      names: formatConjunctionList(
        missingForMonth.map((item) => item.name),
        locale,
      ),
    });
  }, [missingForMonth, locale, t]);

  const modalTitle = t('balance.patrimony.recordBalancesTitleWithMonth', {
    month: formatMonthKeyLong(resolvedMonthKey, locale),
  });

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

  const handleSubmit = (rowsOverride) => {
    const assetsToSave = rowsOverride?.assetRows ?? assetRows;
    const liabilitiesToSave = rowsOverride?.liabilityRows ?? liabilityRows;
    const liabilityRowsForSnapshot = liabilitiesToSave.map((row) => {
      const liability = activeLiabilities.find((l) => l.id === row.liabilityId);
      if (!liability || row.value == null) return row;
      return {
        ...row,
        value: mortgageOutstandingTotalToShare(settings, liability, row.value),
      };
    });
    for (const row of liabilitiesToSave) {
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
      assetRows: assetsToSave,
      liabilityRows: liabilityRowsForSnapshot,
      snapshotDate: initial.snapshotDate,
      existingSnapshots: snapshots,
    });
    onConfirm(resolvedMonthKey, snaps);
    onClose();
  };

  const handleSaveClick = () => {
    if (emptyRowsRemain) {
      setShowEmptyConfirm(true);
      return;
    }
    setShowEmptyConfirm(false);
    handleSubmit();
  };

  const handleConfirmSaveWithZeros = () => {
    setShowEmptyConfirm(false);
    handleSubmit(fillEmptyCloseRows(assetRows, liabilityRows));
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
    const missingSnapshot = row.prefillSource !== 'current';
    const showInvestmentEmptyHint =
      isInvestmentAssetCategory(asset.category) &&
      row.prefillSource === 'empty' &&
      !row.modified &&
      (row.value == null || Number(row.value) === 0);
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
          pending={missingSnapshot}
          hint={
            prefillHint(row) ??
            (showInvestmentEmptyHint
              ? t('balance.patrimony.closeInvestmentEmptyHint')
              : undefined)
          }
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
    const missingSnapshot = row.prefillSource !== 'current';
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
          pending={missingSnapshot}
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
      title={modalTitle}
      subtitle={modalSubtitle}
      maxHeightClass="max-h-[85dvh]"
      footer={
        <div className="w-full space-y-3">
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
            <ModalFormFooter
              onCancel={() => {
                setShowEmptyConfirm(false);
                onClose();
              }}
              onSave={handleSaveClick}
              canSave={canSaveDraft}
              saveLabel={t('balance.patrimony.recordBalancesConfirm')}
            />
          </div>
          {showEmptyConfirm ? (
            <div className="rounded-xl [border:0.5px_solid_rgba(239,159,39,0.30)] bg-[rgba(239,159,39,0.10)] px-4 py-3">
              <p className="text-sm leading-snug text-[var(--color-warning)]">
                {t('balance.patrimony.closeEmptyFieldsConfirm', {
                  count: emptyFieldCount,
                })}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={ui.btnPrimary}
                  onClick={handleConfirmSaveWithZeros}
                >
                  {t('balance.patrimony.closeEmptyFieldsConfirmYes')}
                </button>
                <button
                  type="button"
                  className={ui.btnSecondary}
                  onClick={() => setShowEmptyConfirm(false)}
                >
                  {t('balance.patrimony.closeEmptyFieldsConfirmReview')}
                </button>
              </div>
            </div>
          ) : null}
        </div>
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
              className="w-full rounded-xl [border:0.5px_solid_rgba(29,158,117,0.25)] bg-[rgba(29,158,117,0.10)] px-5 py-4 text-left text-sm font-medium text-[var(--color-positive)] transition hover:bg-[rgba(29,158,117,0.15)]"
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
                        ? 'text-[var(--color-positive)]'
                        : 'text-[var(--color-negative)]'
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
