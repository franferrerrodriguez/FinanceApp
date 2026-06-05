import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePrunePatrimonyDrafts } from '../../../hooks/usePrunePatrimonyDrafts';
import { usePatrimonySave } from '../../../hooks/usePatrimonySave';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  notifyAfterSave,
  useToast,
} from '../../../context/ToastContext';
import { FinanceAlerts } from '../../../components/FinanceAlerts';
import { useFinanceAlerts } from '../../../hooks/useFinanceAlerts';
import { getAssetCategories, getLiabilityCategories } from '../../../lib/categoryLabels';
import { getCurrentMonthKey } from '../../../lib/dashboardMetrics';
import { isMonthKey, isMonthlyCloseAlert } from '../../../lib/monthlyClose';
import {
  countSnapshotMonthsForAsset,
  countSnapshotMonthsForLiability,
} from '../../../lib/snapshotUtils';
import { formatInstitutionLabel } from '../../../lib/institutions';
import {
  createAsset,
  createLiability,
  getActiveAssets,
  getActiveLiabilities,
  getCurrentPatrimonySummary,
  getSnapshotValueForItem,
} from '../../../lib/patrimony';
import { SNAPSHOT_ITEM_TYPE } from '../../../lib/snapshotItemTypes';
import { isDraftAsset } from '../../../lib/patrimonyDrafts';
import {
  applyAutoAssetNames,
  getAssetBaseLabel,
} from '../../../lib/patrimonyNames';
import {
  SPANISH_BANK_IDS,
  SPANISH_BANK_LEGACY_LABELS,
} from '../../../lib/spanishBanks';
import { ui } from '../../../lib/uiClasses';
import { useFinanceData, usePreferences } from '../../../store/hooks';
import {
  formatMonthKey,
  formatMonthKeyLong,
  formatSnapshotDateLabel,
} from '../../../utils/monthLabel';
import { formatMoney } from '../../../utils/formatters';
import { AssetEditModal } from './AssetEditModal';
import { LiabilityEditModal } from './LiabilityEditModal';
import { PatrimonyDeleteConfirmModal } from './PatrimonyDeleteConfirmModal';
import { MonthlyCloseModal } from './MonthlyCloseModal';
import { PatrimonyCatalogTable } from './PatrimonyCatalogTable';
import { PatrimonyEvolutionSection } from './PatrimonyEvolutionSection';
import { PatrimonyHistoryTable } from './PatrimonyHistoryTable';

export function PatrimonyPanel() {
  const { t } = useTranslation();
  const { locale } = usePreferences();
  const [searchParams, setSearchParams] = useSearchParams();
  const { alerts, monthlyClose } = useFinanceAlerts();
  const patrimonyAlerts = useMemo(
    () => alerts.filter((alert) => !isMonthlyCloseAlert(alert)),
    [alerts],
  );
  const {
    settings,
    assets,
    liabilities,
    snapshots,
    addAsset,
    updateAsset,
    removeAsset,
    addLiability,
    updateLiability,
    removeLiability,
    closeMonthSnapshots,
  } = useFinanceData();

  usePrunePatrimonyDrafts(assets, liabilities);
  const toast = useToast();
  const { saveToCloud } = usePatrimonySave();

  const currentMonthKey = getCurrentMonthKey();
  const [balancesOpen, setBalancesOpen] = useState(false);
  const [balancesMonthKey, setBalancesMonthKey] = useState(
    monthlyClose?.suggestedMonthKey ?? currentMonthKey,
  );

  const openRecordBalances = useCallback(
    (monthKey) => {
      setBalancesMonthKey(monthKey ?? monthlyClose?.suggestedMonthKey ?? currentMonthKey);
      setBalancesOpen(true);
    },
    [monthlyClose?.suggestedMonthKey, currentMonthKey],
  );

  useEffect(() => {
    const param = searchParams.get('closeMonth');
    if (!param || !isMonthKey(param)) return;
    openRecordBalances(param);
    const next = new URLSearchParams(searchParams);
    next.delete('closeMonth');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, openRecordBalances]);

  const summary = getCurrentPatrimonySummary(snapshots, currentMonthKey);
  const monthLabel = formatMonthKey(currentMonthKey, locale);
  const hasAccounts =
    getActiveAssets(assets).length > 0 || getActiveLiabilities(liabilities).length > 0;

  const hasAnyBalance = summary.hasClose;

  const asOfLabel = summary.hasClose
    ? summary.asOfDate
      ? formatSnapshotDateLabel(summary.asOfDate, locale)
      : monthLabel
    : monthLabel;

  const getAssetBalance = useCallback(
    (asset) => {
      const raw = getSnapshotValueForItem(snapshots, currentMonthKey, {
        type: SNAPSHOT_ITEM_TYPE.ASSET,
        id: asset.id,
      });
      return raw != null && Number.isFinite(raw) ? raw : null;
    },
    [snapshots, currentMonthKey],
  );

  const getLiabilityBalance = useCallback(
    (liability) => {
      const raw = getSnapshotValueForItem(snapshots, currentMonthKey, {
        type: SNAPSHOT_ITEM_TYPE.LIABILITY,
        id: liability.id,
      });
      return raw != null && Number.isFinite(raw) ? Math.abs(Number(raw) || 0) : null;
    },
    [snapshots, currentMonthKey],
  );

  const scrollToPatrimonyHistory = useCallback(() => {
    document.getElementById('patrimony-history')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, []);

  const scrollToPatrimonyCatalog = useCallback(() => {
    document.getElementById('patrimony-assets')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, []);

  return (
    <div className={ui.stackPage}>
      {patrimonyAlerts.length > 0 ? (
        <FinanceAlerts alerts={patrimonyAlerts} className={ui.chartCard} />
      ) : null}

      <div className={`${ui.chartCard} ${ui.stackSection}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
          <div className="min-w-0 flex-1 lg:max-w-xl">
            <h3 className={`text-base font-semibold ${ui.heading}`}>
              {t('balance.patrimony.title')}
            </h3>
            <p className={`mt-1 text-sm ${ui.text}`}>
              {t('balance.patrimony.subtitle')}
            </p>
          </div>
          <RecordBalancesAction
            hasAccounts={hasAccounts}
            pendingMonths={monthlyClose?.pendingMonths?.length}
            suggestedMonthKey={monthlyClose?.suggestedMonthKey}
            locale={locale}
            onOpen={() => openRecordBalances()}
            onGoToCatalog={scrollToPatrimonyCatalog}
          />
        </div>

        {hasAccounts && !summary.hasClose ? <PatrimonyStepsHint /> : null}

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Kpi
            label={t('balance.patrimony.netWorth')}
            value={summary.hasClose ? formatMoney(summary.netWorth) : '—'}
            hint={
              summary.hasClose
                ? summary.asOfDate
                  ? t('balance.patrimony.asOfDate', {
                      date: formatSnapshotDateLabel(summary.asOfDate, locale),
                    })
                  : t('balance.patrimony.asOfMonth', { month: monthLabel })
                : hasAccounts
                  ? t('balance.patrimony.noCloseYet', { month: monthLabel })
                  : t('balance.patrimony.noAccountsYet')
            }
          />
          <Kpi
            label={t('balance.patrimony.totalAssets')}
            value={summary.hasClose ? formatMoney(summary.totalAssets) : '—'}
          />
          <Kpi
            label={t('balance.patrimony.totalLiabilities')}
            value={
              summary.hasClose
                ? formatMoney(Math.abs(summary.totalLiabilities ?? 0))
                : '—'
            }
            liability
          />
        </div>
      </div>

      <PatrimonyAssetsSection
        settings={settings}
        assets={assets}
        snapshots={snapshots}
        getBalance={getAssetBalance}
        addAsset={addAsset}
        updateAsset={updateAsset}
        removeAsset={removeAsset}
        saveToCloud={saveToCloud}
        asOfLabel={asOfLabel}
        hasAnyBalance={hasAnyBalance}
        onViewHistory={hasAnyBalance ? scrollToPatrimonyHistory : undefined}
      />

      <PatrimonyLiabilitiesSection
        settings={settings}
        liabilities={liabilities}
        snapshots={snapshots}
        getBalance={getLiabilityBalance}
        addLiability={addLiability}
        updateLiability={updateLiability}
        removeLiability={removeLiability}
        saveToCloud={saveToCloud}
        asOfLabel={asOfLabel}
        hasAnyBalance={hasAnyBalance}
      />

      <section
        id="patrimony-history"
        className={`${ui.chartCard} ${ui.stackSection} scroll-mt-24`}
      >
        <SectionHeader
          title={t('balance.patrimony.historyTitle')}
          subtitle={t('balance.patrimony.historySubtitle')}
        />
        <PatrimonyHistoryTable
          assets={assets}
          liabilities={liabilities}
          snapshots={snapshots}
        />
      </section>

      <PatrimonyEvolutionSection snapshots={snapshots} locale={locale} />

      <MonthlyCloseModal
        open={balancesOpen}
        onClose={() => setBalancesOpen(false)}
        assets={assets}
        liabilities={liabilities}
        snapshots={snapshots}
        monthKey={balancesMonthKey}
        onMonthKeyChange={setBalancesMonthKey}
        onConfirm={(monthKey, snaps) => {
          closeMonthSnapshots(monthKey, snaps);
          toast.success(t('toast.balancesSaved'));
          requestAnimationFrame(() => {
            document
              .getElementById('patrimony-assets')
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        }}
      />
    </div>
  );
}

function RecordBalancesAction({
  hasAccounts,
  pendingMonths,
  suggestedMonthKey,
  locale,
  onOpen,
  onGoToCatalog,
}) {
  const { t } = useTranslation();
  const currentMonthKey = getCurrentMonthKey();
  const label =
    pendingMonths &&
    suggestedMonthKey &&
    suggestedMonthKey !== currentMonthKey
      ? t('balance.patrimony.recordBalancesFor', {
          month: formatMonthKeyLong(suggestedMonthKey, locale),
        })
      : t('balance.patrimony.recordBalances');

  return (
    <div className="flex w-full min-w-0 flex-col items-stretch gap-2 lg:w-auto lg:max-w-[18rem] lg:shrink-0 lg:items-end">
      <button
        type="button"
        className={`${ui.btnPrimary} w-full lg:w-auto`}
        disabled={!hasAccounts}
        aria-disabled={!hasAccounts}
        aria-describedby={
          hasAccounts ? 'record-balances-why' : 'record-balances-blocked'
        }
        onClick={onOpen}
      >
        {label}
      </button>

      {hasAccounts ? (
        <p
          id="record-balances-why"
          className={`text-xs leading-snug ${ui.textMuted} lg:text-right`}
        >
          {t('balance.patrimony.recordBalancesWhy')}
        </p>
      ) : (
        <div
          id="record-balances-blocked"
          role="status"
          className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2.5 text-left text-xs leading-snug text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-100 lg:text-right"
        >
          <p>{t('balance.patrimony.recordBalancesBlocked')}</p>
          <button
            type="button"
            className="mt-2 font-semibold underline underline-offset-2 hover:no-underline"
            onClick={onGoToCatalog}
          >
            {t('balance.patrimony.recordBalancesGoToCatalog')}
          </button>
        </div>
      )}
    </div>
  );
}

function PatrimonyStepsHint() {
  const { t } = useTranslation();

  return (
    <p
      className={`rounded-xl border px-4 py-3 text-sm ${ui.cardMuted} ${ui.text}`}
      role="status"
    >
      {t('balance.patrimony.stepsNeedBalances')}
    </p>
  );
}

function SectionHeader({ title, subtitle, hint }) {
  return (
    <div className={`border-b pb-3 ${ui.divider}`}>
      <h3 className={`text-base font-semibold ${ui.heading}`}>{title}</h3>
      <p className={`mt-1 text-sm ${ui.textMuted}`}>{subtitle}</p>
      {hint ? (
        <p className={`mt-1.5 text-xs ${ui.textMuted}`}>{hint}</p>
      ) : null}
    </div>
  );
}

function EmptyBlock({ message }) {
  return (
    <div className={`px-6 py-8 text-center ${ui.cardDashed}`}>
      <p className={`text-sm ${ui.text}`}>{message}</p>
    </div>
  );
}

function PatrimonyAssetsSection({
  settings,
  assets,
  snapshots,
  getBalance,
  addAsset,
  updateAsset,
  removeAsset,
  saveToCloud,
  asOfLabel,
  hasAnyBalance,
  onViewHistory,
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const categories = getAssetCategories(t);
  const categoryLabel = (cat) =>
    categories.find((c) => c.value === cat)?.label ?? cat;
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const assetBaseLabel = (asset) =>
    getAssetBaseLabel(
      asset,
      (provider) =>
        formatInstitutionLabel(
          provider,
          SPANISH_BANK_IDS,
          t,
          'balance.banks',
          SPANISH_BANK_LEGACY_LABELS,
        ),
      categoryLabel,
    );

  const syncAutoNames = (list) => applyAutoAssetNames(list, assetBaseLabel);

  const savableAssets = useMemo(
    () => assets.filter((a) => !isDraftAsset(a)),
    [assets],
  );
  const catalogAssets = useMemo(
    () => syncAutoNames(savableAssets),
    [savableAssets, t],
  );

  useEffect(() => {
    for (const asset of catalogAssets) {
      const prev = savableAssets.find((a) => a.id === asset.id);
      if (prev && prev.name !== asset.name) {
        updateAsset(asset.id, { name: asset.name });
      }
    }
  }, [catalogAssets, savableAssets, updateAsset]);

  const applyAssetList = (next) => {
    for (const asset of next) {
      const prev = assets.find((a) => a.id === asset.id);
      if (!prev) {
        addAsset(createAsset(asset));
        continue;
      }
      const patch = {};
      for (const key of [
        'name',
        'category',
        'provider',
        'notes',
        'customAnnualReturn',
        'isActive',
      ]) {
        if (prev[key] !== asset[key]) patch[key] = asset[key];
      }
      if (Object.keys(patch).length) updateAsset(asset.id, patch);
    }
  };

  const openCreate = () =>
    setModal({ mode: 'create', draft: createAsset({ name: '' }) });
  const openEdit = (asset) =>
    setModal({ mode: 'edit', id: asset.id, draft: { ...asset } });
  const closeModal = () => setModal(null);

  const handleModalSave = async (draft) => {
    const merged =
      modal?.mode === 'create'
        ? [...assets, createAsset({ ...draft, name: '' })]
        : assets.map((a) =>
            a.id === modal.id ? { ...a, ...draft, name: a.name } : a,
          );
    applyAssetList(syncAutoNames(merged));
    closeModal();
    await notifyAfterSave({
      toast,
      t,
      actionKey:
        modal?.mode === 'create' ? 'toast.assetCreated' : 'toast.assetUpdated',
      saveFn: saveToCloud,
    });
  };

  const requestDelete = (asset) => setDeleteTarget(asset);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    if (modal?.mode === 'edit' && modal.id === id) closeModal();
    removeAsset(id);
    const remaining = syncAutoNames(assets.filter((a) => a.id !== id));
    for (const asset of remaining) {
      const prev = assets.find((a) => a.id === asset.id);
      if (prev && prev.name !== asset.name) {
        updateAsset(asset.id, { name: asset.name });
      }
    }
    setDeleteTarget(null);
    await notifyAfterSave({
      toast,
      t,
      actionKey: 'toast.assetDeleted',
      saveFn: saveToCloud,
    });
  };

  const handleModalDelete = () => {
    if (modal?.mode !== 'edit') return;
    const asset = assets.find((a) => a.id === modal.id);
    if (asset) requestDelete(asset);
  };

  return (
    <section
      id="patrimony-assets"
      className={`${ui.chartCard} ${ui.stackSection} scroll-mt-24`}
    >
      <SectionHeader
        title={t('balance.patrimony.assetsTitle')}
        subtitle={t('balance.patrimony.assetsSubtitle')}
        hint={
          hasAnyBalance
            ? t('balance.patrimony.balancesAsOf', { date: asOfLabel })
            : catalogAssets.length > 0
              ? t('balance.patrimony.balancesMissing')
              : null
        }
      />

      {catalogAssets.length > 0 ? (
        <PatrimonyCatalogTable
          kind="asset"
          items={catalogAssets}
          categoryLabel={categoryLabel}
          settings={settings}
          getBalance={getBalance}
          onEdit={openEdit}
          onDelete={requestDelete}
        />
      ) : (
        <EmptyBlock message={t('balance.patrimony.assetsEmpty')} />
      )}

      {hasAnyBalance && onViewHistory ? (
        <button
          type="button"
          onClick={onViewHistory}
          className="text-sm font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
        >
          {t('balance.patrimony.currentBalancesViewHistory')}
        </button>
      ) : null}

      <CatalogSectionToolbar
        addLabel={
          catalogAssets.length > 0
            ? t('balance.patrimony.addAnotherAsset')
            : t('balance.patrimony.addFirstAsset')
        }
        onAdd={openCreate}
      />

      <PatrimonyDeleteConfirmModal
        open={deleteTarget != null}
        itemName={deleteTarget?.name ?? ''}
        snapshotMonths={
          deleteTarget
            ? countSnapshotMonthsForAsset(snapshots, deleteTarget.id)
            : 0
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <AssetEditModal
        open={modal != null}
        mode={modal?.mode ?? 'create'}
        initialDraft={modal?.draft ?? createAsset({ name: '' })}
        onClose={closeModal}
        onSave={handleModalSave}
        onDelete={handleModalDelete}
      />
    </section>
  );
}

function PatrimonyLiabilitiesSection({
  settings,
  liabilities,
  snapshots,
  getBalance,
  addLiability,
  updateLiability,
  removeLiability,
  saveToCloud,
  asOfLabel,
  hasAnyBalance,
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const categories = getLiabilityCategories(t);
  const categoryLabel = (cat) =>
    categories.find((c) => c.value === cat)?.label ?? cat;
  const catalogLiabilities = useMemo(
    () =>
      liabilities.filter((l) => l.id !== settings?.linkedMortgageLiabilityId),
    [liabilities, settings?.linkedMortgageLiabilityId],
  );
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openCreate = () =>
    setModal({ mode: 'create', draft: createLiability({ name: '' }) });
  const openEdit = (liability) =>
    setModal({ mode: 'edit', id: liability.id, draft: { ...liability } });
  const closeModal = () => setModal(null);

  const handleModalSave = async (draft) => {
    if (modal?.mode === 'create') {
      addLiability(createLiability(draft));
    } else if (modal?.mode === 'edit') {
      updateLiability(modal.id, draft);
    }
    closeModal();
    await notifyAfterSave({
      toast,
      t,
      actionKey:
        modal?.mode === 'create'
          ? 'toast.liabilityCreated'
          : 'toast.liabilityUpdated',
      saveFn: saveToCloud,
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (modal?.mode === 'edit' && modal.id === deleteTarget.id) closeModal();
    removeLiability(deleteTarget.id);
    setDeleteTarget(null);
    await notifyAfterSave({
      toast,
      t,
      actionKey: 'toast.liabilityDeleted',
      saveFn: saveToCloud,
    });
  };

  const handleModalDelete = () => {
    if (modal?.mode !== 'edit') return;
    const liability = liabilities.find((l) => l.id === modal.id);
    if (liability) setDeleteTarget(liability);
  };

  return (
    <section className={`${ui.chartCard} ${ui.stackSection}`}>
      <SectionHeader
        title={t('balance.patrimony.liabilitiesTitle')}
        subtitle={t('balance.patrimony.liabilitiesSubtitle')}
        hint={
          hasAnyBalance && catalogLiabilities.length > 0
            ? t('balance.patrimony.balancesAsOf', { date: asOfLabel })
            : null
        }
      />

      {catalogLiabilities.length > 0 ? (
        <PatrimonyCatalogTable
          kind="liability"
          items={catalogLiabilities}
          categoryLabel={categoryLabel}
          providerLabel={(item) => formatMoney(item.monthlyPayment ?? 0)}
          getBalance={getBalance}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        />
      ) : (
        <EmptyBlock
          message={
            settings?.linkedMortgageLiabilityId
              ? t('balance.patrimony.liabilitiesHousingOnly')
              : t('balance.patrimony.liabilitiesEmpty')
          }
        />
      )}

      <CatalogSectionToolbar
        addLabel={
          catalogLiabilities.length > 0
            ? t('balance.patrimony.addAnotherLiability')
            : t('balance.patrimony.addFirstLiability')
        }
        onAdd={openCreate}
      />

      <PatrimonyDeleteConfirmModal
        open={deleteTarget != null}
        itemName={deleteTarget?.name ?? ''}
        snapshotMonths={
          deleteTarget
            ? countSnapshotMonthsForLiability(snapshots, deleteTarget.id)
            : 0
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <LiabilityEditModal
        open={modal != null}
        mode={modal?.mode ?? 'create'}
        initialDraft={modal?.draft ?? createLiability({ name: '' })}
        onClose={closeModal}
        onSave={handleModalSave}
        onDelete={handleModalDelete}
      />
    </section>
  );
}

function CatalogSectionToolbar({ addLabel, onAdd }) {
  return (
    <div className={`border-t pt-4 ${ui.divider}`}>
      <button type="button" className={ui.btnPrimary} onClick={onAdd}>
        {addLabel}
      </button>
    </div>
  );
}

function Kpi({ label, value, hint, liability }) {
  return (
    <div className={`${ui.block} px-3 py-2.5`}>
      <p className={`text-xs font-medium ${ui.textMuted}`}>{label}</p>
      <p
        className={`mt-1 text-lg font-semibold tabular-nums ${
          liability ? 'text-red-600 dark:text-red-400' : ui.heading
        }`}
      >
        {value}
      </p>
      {hint ? (
        <p className={`mt-1 text-xs leading-snug ${ui.textMuted}`}>{hint}</p>
      ) : null}
    </div>
  );
}

