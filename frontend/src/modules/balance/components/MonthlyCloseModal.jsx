import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { EffectiveMonthSelect } from '../../../components/EffectiveMonthSelect';
import { getCurrentMonthKey } from '../../../lib/dashboardMetrics';
import { getMonthlyCloseMonthOptions } from '../../../lib/monthlyClose';
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

export function MonthlyCloseModal({
  open,
  onClose,
  assets,
  liabilities,
  snapshots,
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

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const canSubmit = activeAssets.length > 0 || activeLiabilities.length > 0;
  const isUpdate = selectedOption?.hasClose;
  const snapshotDateLabel = formatSnapshotDateLabel(initial.snapshotDate, locale);

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

  return createPortal(
    <div className="fixed inset-0 z-[210] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className={ui.modalBackdrop}
        aria-label={t('menu.close')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-balances-title"
        className={`${ui.modalPanel} relative z-[211] flex max-h-[min(90vh,40rem)] w-full max-w-lg flex-col`}
      >
        <div className={`shrink-0 border-b px-6 py-4 ${ui.divider}`}>
          <h2 id="record-balances-title" className={`text-lg font-semibold ${ui.heading}`}>
            {t('balance.patrimony.recordBalancesTitle')}
          </h2>
          <p className={`mt-1 text-sm ${ui.textMuted}`}>
            {isUpdate
              ? t('balance.patrimony.recordBalancesUpdateSubtitle', {
                  month: formatMonthKeyLong(resolvedMonthKey, locale),
                })
              : t('balance.patrimony.recordBalancesSubtitle', {
                  month: formatMonthKeyLong(resolvedMonthKey, locale),
                  date: snapshotDateLabel,
                })}
          </p>

          {monthOptions.length > 0 ? (
            <div className="mt-4 space-y-2">
              <label className={`block text-sm font-medium ${ui.textLabel}`}>
                {t('balance.patrimony.recordBalancesMonth')}
              </label>
              <EffectiveMonthSelect
                id="record-balances-month"
                value={resolvedMonthKey}
                extraMonthKeys={monthOptions.map((o) => o.monthKey)}
                lookbackMonths={48}
                onChange={(mk) => onMonthKeyChange?.(mk)}
                ariaLabel={t('balance.patrimony.recordBalancesMonth')}
              />
              {selectedOption ? (
                <p className={`text-xs ${ui.textMuted}`}>
                  {selectedOption.hasClose
                    ? t('balance.patrimony.recordBalancesMonthClosed')
                    : t('balance.patrimony.recordBalancesMonthPending')}
                  {isCurrentMonth
                    ? ` · ${t('balance.patrimony.recordBalancesCurrentMonthHint')}`
                    : null}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
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
                          <label className="mt-2 block">
                            <span className="sr-only">{t('balance.patrimony.value')}</span>
                            <input
                              type="number"
                              min={0}
                              step="1"
                              value={row?.value ?? 0}
                              onChange={(e) => {
                                const value = Math.max(
                                  0,
                                  parseFloat(e.target.value) || 0,
                                );
                                setAssetRows((prev) =>
                                  prev.map((r) =>
                                    r.assetId === asset.id ? { ...r, value } : r,
                                  ),
                                );
                              }}
                              className={`${ui.input} ${ui.inputAmount} mt-1 w-full max-w-none`}
                            />
                          </label>
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
                  <p className={`mb-2 text-xs ${ui.textMuted}`}>
                    {t('balance.patrimony.closeLiabilitiesHint')}
                  </p>
                  <ul className="space-y-2">
                    {activeLiabilities.map((liability) => {
                      const row = liabilityRows.find(
                        (r) => r.liabilityId === liability.id,
                      );
                      return (
                        <li key={liability.id} className={`p-3 ${ui.cardInset}`}>
                          <p className={`text-sm font-medium ${ui.textLabel}`}>
                            {liability.name}
                          </p>
                          <p className={`text-xs ${ui.textMuted}`}>
                            {t(`categories.liability.${liability.category}`)}
                          </p>
                          <label className="mt-2 block">
                            <span className="sr-only">{t('balance.patrimony.debtValue')}</span>
                            <input
                              type="number"
                              min={0}
                              step="1"
                              value={row?.value ?? 0}
                              onChange={(e) => {
                                const value = Math.max(
                                  0,
                                  parseFloat(e.target.value) || 0,
                                );
                                setLiabilityRows((prev) =>
                                  prev.map((r) =>
                                    r.liabilityId === liability.id
                                      ? { ...r, value }
                                      : r,
                                  ),
                                );
                              }}
                              className={`${ui.input} ${ui.inputAmount} mt-1 w-full max-w-none`}
                            />
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ) : null}
            </div>
          )}
        </div>

        <div
          className={`flex shrink-0 flex-col gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end ${ui.divider}`}
        >
          <button type="button" className={ui.btnSecondary} onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className={ui.btnPrimary}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {t('balance.patrimony.recordBalancesConfirm')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
