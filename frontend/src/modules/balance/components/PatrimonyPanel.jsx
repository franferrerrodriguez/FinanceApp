import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePrunePatrimonyDrafts } from '../../../hooks/usePrunePatrimonyDrafts';
import { usePatrimonySave } from '../../../hooks/usePatrimonySave';
import { useTranslation } from 'react-i18next';
import {
  notifyAfterSave,
  useToast,
} from '../../../context/ToastContext';
import { getNetWorthTone, KpiCard } from '../../../components/KpiCard';
import { getAssetCategories, getLiabilityCategories } from '../../../lib/categoryLabels';
import { getMortgageRentTotal } from '../../../lib/calculations';
import { getCurrentMonthKey } from '../../../lib/dashboardMetrics';
import {
  countSnapshotMonthsForAsset,
  countSnapshotMonthsForLiability,
} from '../../../lib/snapshotUtils';
import { formatInstitutionLabel } from '../../../lib/institutions';
import {
  createAsset,
  createLiability,
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
  formatSnapshotDateLabel,
} from '../../../utils/monthLabel';
import { formatMoney } from '../../../utils/formatters';
import { AssetEditModal } from './AssetEditModal';
import { LiabilityEditModal } from './LiabilityEditModal';
import { PatrimonyDeleteConfirmModal } from './PatrimonyDeleteConfirmModal';
import { BalanceSetupStepBanner } from './BalanceSetupStepBanner';
import { useRecordBalances } from './RecordBalancesProvider';
import { BALANCE_SETUP_STEP, needsAddAssetsSetup } from '../../../lib/balanceSetupProgress';
import {
  getLiabilityMonthlyPaymentDisplay,
  getMortgageBalanceShareInfo,
  getMortgageFullMonthlyPayment,
  getMortgageYourShareOutstandingBalance,
  getMortgageYourSharePayment,
  HOUSING_TYPE,
  isLinkedHousingMortgage,
  isLinkedMortgageLiability,
  mortgageOutstandingShareToTotal,
  mortgagePaymentSettingsPatch,
} from '../../../lib/housingLiability';
import { getLiabilityOutstandingFromSnapshots } from '../../../lib/liabilitySnapshots';
import { getDefaultReturnForAssetCategory } from '../../../lib/projectionReturns';
import { PatrimonyCatalogTable } from './PatrimonyCatalogTable';
import { PatrimonyEvolutionSection } from './PatrimonyEvolutionSection';
import { PatrimonyHistoryTable } from './PatrimonyHistoryTable';

export function PatrimonyPanel() {
  const { t } = useTranslation();
  const { locale } = usePreferences();
  const location = useLocation();
  const navigate = useNavigate();
  const { openRecordBalances, goToPatrimonyCatalog, hasAccounts } =
    useRecordBalances();

  const autoOpenAsset = location.state?.openAddAsset === true;
  const autoOpenRecordBalances = location.state?.openRecordBalances === true;

  useEffect(() => {
    if (!autoOpenAsset && !autoOpenRecordBalances) return;
    navigate(location.pathname + location.search, { replace: true, state: {} });
    if (autoOpenRecordBalances && hasAccounts) {
      openRecordBalances();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const {
    settings,
    assets,
    liabilities,
    snapshots,
    addAsset,
    updateAsset,
    removeAsset,
    addSnapshot,
    upsertSnapshot,
    addLiability,
    updateLiability,
    removeLiability,
    applyHousingType,
    setLiabilityOutstandingBalance,
    setSettings,
  } = useFinanceData();

  usePrunePatrimonyDrafts(assets, liabilities);
  const toast = useToast();
  const { saveToCloud } = usePatrimonySave();

  const currentMonthKey = getCurrentMonthKey();
  const summary = getCurrentPatrimonySummary(snapshots, currentMonthKey);
  const monthLabel = formatMonthKey(currentMonthKey, locale);

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
      const share = getMortgageYourShareOutstandingBalance(
        snapshots,
        liability,
        currentMonthKey,
      );
      return share != null && Number.isFinite(share) ? share : null;
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
      {needsAddAssetsSetup(assets) ? (
        <BalanceSetupStepBanner
          stepId={BALANCE_SETUP_STEP.ADD_ASSETS}
          onAction={scrollToPatrimonyCatalog}
        />
      ) : (
        <>
          <BalanceSetupStepBanner
            stepId={BALANCE_SETUP_STEP.ACCOUNTS}
            onAction={
              hasAccounts ? () => openRecordBalances() : scrollToPatrimonyCatalog
            }
          />
          <BalanceSetupStepBanner
            stepId={BALANCE_SETUP_STEP.LIQUID}
            onAction={scrollToPatrimonyCatalog}
          />
        </>
      )}

      <div className={`${ui.chartCard} ${ui.stackSection}`}>
        <div>
          <h3 className={`text-base font-semibold ${ui.heading}`}>
            {t('balance.patrimony.title')}
          </h3>
          <p className={`mt-1 text-sm ${ui.text}`}>
            {t('balance.patrimony.subtitle')}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <KpiCard
            compact
            accent
            label={t('balance.patrimony.netWorth')}
            value={summary.hasClose ? formatMoney(summary.netWorth) : '—'}
            valueTone={
              summary.hasClose ? getNetWorthTone(summary.netWorth) : 'default'
            }
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
            hideFooter
          />
          <KpiCard
            compact
            accent
            label={t('balance.patrimony.totalAssets')}
            value={summary.hasClose ? formatMoney(summary.totalAssets) : '—'}
            valueTone={summary.hasClose ? 'assets' : 'default'}
            hideFooter
          />
          <KpiCard
            compact
            accent
            label={t('balance.patrimony.totalLiabilities')}
            value={
              summary.hasClose
                ? formatMoney(Math.abs(summary.totalLiabilities ?? 0))
                : '—'
            }
            valueTone={summary.hasClose ? 'liability' : 'default'}
            hideFooter
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
        addSnapshot={addSnapshot}
        upsertSnapshot={upsertSnapshot}
        saveToCloud={saveToCloud}
        asOfLabel={asOfLabel}
        hasAnyBalance={hasAnyBalance}
        onViewHistory={hasAnyBalance ? scrollToPatrimonyHistory : undefined}
        autoOpen={autoOpenAsset}
      />

      <PatrimonyLiabilitiesSection
        settings={settings}
        liabilities={liabilities}
        snapshots={snapshots}
        monthKey={currentMonthKey}
        getBalance={getLiabilityBalance}
        addLiability={addLiability}
        updateLiability={updateLiability}
        removeLiability={removeLiability}
        applyHousingType={applyHousingType}
        setLiabilityOutstandingBalance={setLiabilityOutstandingBalance}
        setSettings={setSettings}
        saveToCloud={saveToCloud}
        asOfLabel={asOfLabel}
        hasAnyBalance={hasAnyBalance}
        onViewHistory={hasAnyBalance ? scrollToPatrimonyHistory : undefined}
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
    </div>
  );
}

function SectionHeader({ title, subtitle, hint }) {
  return (
    <div className={`border-b pb-3 ${ui.divider}`}>
      <h3 className={`text-base font-semibold ${ui.heading}`}>{title}</h3>
      <p className={`mt-1 text-sm ${ui.textMuted}`}>{subtitle}</p>
      {hint ? (
        <p className={`${ui.formFieldHint} ${ui.textMuted} ${ui.formFieldHintGap}`}>
          {hint}
        </p>
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
  addSnapshot,
  upsertSnapshot,
  saveToCloud,
  asOfLabel,
  hasAnyBalance,
  onViewHistory,
  autoOpen = false,
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const categories = getAssetCategories(t);
  const categoryLabel = (cat) =>
    categories.find((c) => c.value === cat)?.label ?? cat;
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const autoOpenedRef = useRef(false);

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
        'tracksGainLoss',
        'isActive',
      ]) {
        if (prev[key] !== asset[key]) patch[key] = asset[key];
      }
      if (Object.keys(patch).length) updateAsset(asset.id, patch);
    }
  };

  const openCreate = () =>
    setModal({ mode: 'create', draft: createAsset({ name: '' }) });
  const openEdit = (asset) => {
    const latestSnap = [...snapshots]
      .filter((s) => s.assetId === asset.id)
      .sort((a, b) => String(b.snapshotDate ?? '').localeCompare(String(a.snapshotDate ?? '')))[0];
    const currentBalance = latestSnap?.value ?? null;
    setModal({
      mode: 'edit',
      id: asset.id,
      originalBalance: currentBalance,
      draft: {
        ...asset,
        currentBalance,
        customAnnualReturn:
          asset.customAnnualReturn != null
            ? asset.customAnnualReturn
            : getDefaultReturnForAssetCategory(asset.category, settings),
      },
    });
  };
  const closeModal = () => setModal(null);

  useEffect(() => {
    if (autoOpen && !autoOpenedRef.current) {
      autoOpenedRef.current = true;
      openCreate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen]);

  const handleModalSave = async (draft) => {
    let newAssetId = null;
    let merged;
    if (modal?.mode === 'create') {
      const newAsset = createAsset({ ...draft, name: '' });
      newAssetId = newAsset.id;
      merged = [...assets, newAsset];
    } else {
      merged = assets.map((a) =>
        a.id === modal.id ? { ...a, ...draft, name: a.name } : a,
      );
    }
    applyAssetList(syncAutoNames(merged));
    if (newAssetId && draft.initialBalance > 0) {
      const today = new Date().toISOString().slice(0, 10);
      addSnapshot({ id: crypto.randomUUID(), assetId: newAssetId, snapshotDate: today, value: draft.initialBalance });
    }
    if (modal?.mode === 'edit' && draft.currentBalance != null && draft.currentBalance !== modal.originalBalance) {
      const today = new Date().toISOString().slice(0, 10);
      upsertSnapshot({ id: crypto.randomUUID(), assetId: modal.id, snapshotDate: today, value: draft.currentBalance });
    }
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
          className="text-sm font-medium text-[var(--accent)] underline-offset-2 hover:underline"
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
  monthKey,
  getBalance,
  addLiability,
  updateLiability,
  removeLiability,
  applyHousingType,
  setLiabilityOutstandingBalance,
  setSettings,
  saveToCloud,
  asOfLabel,
  hasAnyBalance,
  onViewHistory,
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const categories = getLiabilityCategories(t);
  const categoryLabel = (cat) =>
    categories.find((c) => c.value === cat)?.label ?? cat;
  const catalogLiabilities = useMemo(
    () => getActiveLiabilities(liabilities),
    [liabilities],
  );
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const openCreate = () =>
    setModal({
      mode: 'create',
      draft: { ...createLiability({ name: '' }), outstandingBalance: '', interestRate: null },
    });
  const openEdit = (liability) => {
    const share = getLiabilityOutstandingFromSnapshots(
      snapshots,
      liability.id,
      monthKey,
    );
    setModal({
      mode: 'edit',
      id: liability.id,
      draft: {
        ...liability,
        monthlyPayment: isLinkedMortgageLiability(liability, settings)
          ? getMortgageRentTotal(settings)
          : liability.monthlyPayment,
        outstandingBalance:
          mortgageOutstandingShareToTotal(settings, liability, share) ??
          share ??
          '',
      },
    });
  };
  const closeModal = () => setModal(null);

  const handleModalSave = async (draft) => {
    const { outstandingBalance, enteredOutstandingTotal, monthlyPayment, ...fields } =
      draft;
    const linkedMortgage =
      modal?.mode === 'edit' &&
      isLinkedMortgageLiability(
        { id: modal.id, category: fields.category },
        settings,
      );
    const liabilityPatch = {
      ...fields,
      ...(enteredOutstandingTotal != null ? { enteredOutstandingTotal } : {}),
    };
    if (linkedMortgage) {
      setSettings(mortgagePaymentSettingsPatch(settings, monthlyPayment));
    } else {
      liabilityPatch.monthlyPayment = monthlyPayment;
    }
    if (modal?.mode === 'create') {
      const created = createLiability(liabilityPatch);
      addLiability(created);
      if (outstandingBalance != null) {
        setLiabilityOutstandingBalance(created.id, outstandingBalance, monthKey);
      }
    } else if (modal?.mode === 'edit') {
      updateLiability(modal.id, liabilityPatch);
      if (outstandingBalance != null) {
        setLiabilityOutstandingBalance(modal.id, outstandingBalance, monthKey);
      }
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
    if (isLinkedHousingMortgage(deleteTarget, settings, liabilities)) {
      applyHousingType(HOUSING_TYPE.RENT);
    } else {
      removeLiability(deleteTarget.id);
    }
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

  const getPaymentSubtext = (item) => {
    if (!isLinkedMortgageLiability(item, settings)) return null;
    const paymentShare = getMortgageYourSharePayment(settings, item);
    if (!paymentShare) return null;
    return t('balance.patrimony.tablePaymentFull', {
      amount: formatMoney(getMortgageFullMonthlyPayment(settings, item)),
    });
  };

  const getBalanceSubtext = (item) => {
    const share = getBalance(item);
    if (share == null) return null;
    const balanceShare = getMortgageBalanceShareInfo(settings, item, share);
    if (!balanceShare) return null;
    return t('balance.patrimony.tableBalanceTotal', {
      total: formatMoney(balanceShare.fullTotal),
    });
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
          providerLabel={(item) =>
            formatMoney(getLiabilityMonthlyPaymentDisplay(settings, item))
          }
          getPaymentSubtext={getPaymentSubtext}
          getBalance={getBalance}
          getBalanceSubtext={getBalanceSubtext}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
        />
      ) : (
        <EmptyBlock message={t('balance.patrimony.liabilitiesEmpty')} />
      )}

      {hasAnyBalance && onViewHistory && catalogLiabilities.length > 0 ? (
        <button
          type="button"
          onClick={onViewHistory}
          className="text-sm font-medium text-[var(--accent)] underline-offset-2 hover:underline"
        >
          {t('balance.patrimony.currentBalancesViewHistory')}
        </button>
      ) : null}

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
        settings={settings}
        linkedMortgageId={settings.linkedMortgageLiabilityId}
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

