import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppModal } from '../../../components/AppModal';
import { EffectiveMonthSelect } from '../../../components/EffectiveMonthSelect';
import { FormFieldFrame } from '../../../components/FormFieldFrame';
import { ModalFormFooter } from '../../../components/ModalFormFooter';
import { MoneyInput } from '../../../components/MoneyInput';
import { getEffectiveMortgageRent } from '../../../lib/calculations';
import { getCurrentMonthKey } from '../../../lib/dashboardMetrics';
import { isLinkedHousingMortgage } from '../../../lib/housingLiability';
import { getMonthlyCloseMonthOptions } from '../../../lib/monthlyClose';
import { deriveContributionPreviewForAsset } from '../../../lib/deriveContributionsFromSnapshots';
import {
  buildCloseMonthSnapshots,
  buildMonthlyCloseDrafts,
  getActiveAssets,
  getActiveLiabilities,
} from '../../../lib/patrimony';
import { usePreferences } from '../../../store/hooks';
import { formatInstitutionLabel } from '../../../lib/institutions';
import { formatMonthKeyLong, formatSnapshotDateLabel } from '../../../utils/monthLabel';
import {
  SPANISH_BANK_IDS,
  SPANISH_BANK_LEGACY_LABELS,
} from '../../../lib/spanishBanks';
import { ui } from '../../../lib/uiClasses';
import { formatMoney } from '../../../utils/formatters';

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
  const activeAssets = getActiveAssets(assets);
  const activeLiabilities = getActiveLiabilities(liabilities);
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

  const canSubmit = activeAssets.length > 0 || activeLiabilities.length > 0;
  const isUpdate = selectedOption?.hasClose;
  const snapshotDateLabel = formatSnapshotDateLabel(initial.snapshotDate, locale);
  const housingMortgage = activeLiabilities.find((l) =>
    isLinkedHousingMortgage(l, settings, liabilities),
  );
  const otherLiabilities = activeLiabilities.filter(
    (l) => !isLinkedHousingMortgage(l, settings, liabilities),
  );
  const monthlyMortgagePayment = getEffectiveMortgageRent(settings ?? {});

  const renderLiabilityRow = (liability, { housing = false } = {}) => {
    const row = liabilityRows.find((r) => r.liabilityId === liability.id);

    return (
      <li
        key={liability.id}
        className={`p-3 ${ui.cardInset}${
          housing ? ' border-l-4 border-amber-500/50' : ''
        }`}
      >
        <p className={`text-sm font-medium ${ui.textLabel}`}>
          {housing
            ? t('balance.patrimony.closeHousingMortgageTitle')
            : liability.name}
        </p>
        {housing ? (
          <>
            <p className={`mt-1 text-xs leading-relaxed ${ui.textMuted}`}>
              {monthlyMortgagePayment > 0
                ? t('balance.patrimony.closeHousingMortgageQuota', {
                    payment: formatMoney(monthlyMortgagePayment),
                  })
                : t('balance.patrimony.closeHousingMortgageQuotaMissing')}
            </p>
            <p className={`mt-1 text-xs leading-relaxed ${ui.textMuted}`}>
              {t('balance.patrimony.closeHousingMortgageHint')}
            </p>
          </>
        ) : (
          <p className={`text-xs ${ui.textMuted}`}>
            {t(`categories.liability.${liability.category}`)}
          </p>
        )}
        <div className="mt-2">
          <span className={`mb-1 block text-xs font-medium ${ui.textLabel}`}>
            {t('balance.patrimony.debtValue')}
          </span>
          <MoneyInput
            id={`close-liability-${liability.id}`}
            aria-label={t('balance.patrimony.debtValue')}
            value={row?.value ?? 0}
            fullWidth
            onChange={(value) => {
              setLiabilityRows((prev) =>
                prev.map((r) =>
                  r.liabilityId === liability.id ? { ...r, value } : r,
                ),
              );
            }}
          />
        </div>
      </li>
    );
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

      {!canSubmit ? (
        <p className={`text-sm ${ui.text}`}>{t('balance.patrimony.closeEmpty')}</p>
      ) : (
        <div className="space-y-5">
          {activeAssets.length > 0 ? (
            <section>
              <h3 className={`mb-2 text-sm font-semibold ${ui.heading}`}>
                {t('balance.patrimony.closeAssets')}
              </h3>
              <ul className="space-y-2">
                {activeAssets.map((asset) => {
                  const row = assetRows.find((r) => r.assetId === asset.id);
                  const preview = deriveContributionPreviewForAsset({
                    snapshots,
                    assets,
                    settings,
                    monthKey: resolvedMonthKey,
                    assetId: asset.id,
                    newBalance: row?.value ?? 0,
                  });
                  return (
                    <li key={asset.id} className={`p-3 ${ui.cardInset}`}>
                      <p className={`text-sm font-medium ${ui.textLabel}`}>
                        {asset.name}
                      </p>
                      <p className={`text-xs ${ui.textMuted}`}>
                        {t(`categories.asset.${asset.category}`)}
                        {asset.provider
                          ? ` · ${formatInstitutionLabel(
                              asset.provider,
                              SPANISH_BANK_IDS,
                              t,
                              'balance.banks',
                              SPANISH_BANK_LEGACY_LABELS,
                            )}`
                          : ''}
                      </p>
                      <div className="mt-2">
                        <MoneyInput
                          id={`close-asset-${asset.id}`}
                          aria-label={t('balance.patrimony.value')}
                          value={row?.value ?? 0}
                          fullWidth
                          onChange={(value) => {
                            setAssetRows((prev) =>
                              prev.map((r) =>
                                r.assetId === asset.id ? { ...r, value } : r,
                              ),
                            );
                          }}
                        />
                      </div>
                      {preview ? (
                        <p className={`mt-2 text-xs leading-relaxed ${ui.textMuted}`}>
                          {t('balance.patrimony.derivedContributionHint', {
                            delta: formatMoney(preview.delta),
                            contribution: formatMoney(preview.amount),
                            returnAmount: formatMoney(preview.estimatedReturn),
                          })}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {activeLiabilities.length > 0 ? (
            <section>
              <h3 className={`mb-2 text-sm font-semibold ${ui.heading}`}>
                {t('balance.patrimony.closeLiabilities')}
              </h3>
              {housingMortgage ? null : (
                <p className={`mb-2 text-xs ${ui.textMuted}`}>
                  {t('balance.patrimony.closeLiabilitiesHint')}
                </p>
              )}
              <ul className="space-y-2">
                {housingMortgage
                  ? renderLiabilityRow(housingMortgage, { housing: true })
                  : null}
                {otherLiabilities.map((liability) =>
                  renderLiabilityRow(liability),
                )}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </AppModal>
  );
}
