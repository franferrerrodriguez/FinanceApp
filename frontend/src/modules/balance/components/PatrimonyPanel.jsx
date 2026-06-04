import { useCallback, useEffect, useState } from 'react';
import { usePrunePatrimonyDrafts } from '../../../hooks/usePrunePatrimonyDrafts';
import { usePatrimonySave } from '../../../hooks/usePatrimonySave';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { FormFieldFrame } from '../../../components/FormFieldFrame';
import { InstitutionSelect } from '../../../components/InstitutionSelect';
import { SelectField } from '../../../components/SelectField';
import {
  SPANISH_BANK_IDS,
  SPANISH_BANK_LEGACY_LABELS,
} from '../../../lib/spanishBanks';
import { FinanceAlerts } from '../../../components/FinanceAlerts';
import { useFinanceAlerts } from '../../../hooks/useFinanceAlerts';
import { getAssetCategories, getLiabilityCategories } from '../../../lib/categoryLabels';
import { getCurrentMonthKey } from '../../../lib/dashboardMetrics';
import { isMonthKey } from '../../../lib/monthlyClose';
import {
  createAsset,
  createLiability,
  getActiveAssets,
  getActiveLiabilities,
  getCurrentPatrimonySummary,
} from '../../../lib/patrimony';
import {
  isSavableAsset,
  isSavableLiability,
} from '../../../lib/patrimonyDrafts';
import { ui } from '../../../lib/uiClasses';
import { useFinanceData, usePreferences } from '../../../store/hooks';
import {
  formatMonthKey,
  formatMonthKeyLong,
  formatSnapshotDateLabel,
} from '../../../utils/monthLabel';
import { formatMoney } from '../../../utils/formatters';
import { MonthlyCloseModal } from './MonthlyCloseModal';
import { MonthlyClosePrompt } from './MonthlyClosePrompt';
import { PatrimonyHistoryTable } from './PatrimonyHistoryTable';

export function PatrimonyPanel() {
  const { t } = useTranslation();
  const { locale } = usePreferences();
  const [searchParams, setSearchParams] = useSearchParams();
  const { alerts, monthlyClose } = useFinanceAlerts();
  const {
    assets,
    liabilities,
    snapshots,
    addAsset,
    updateAsset,
    setAssetActive,
    removeAsset,
    addLiability,
    updateLiability,
    setLiabilityActive,
    removeLiability,
    closeMonthSnapshots,
  } = useFinanceData();

  usePrunePatrimonyDrafts();
  const { saveToCloud, status: saveStatus, canCloudSave } = usePatrimonySave();

  const currentMonthKey = getCurrentMonthKey();
  const [pendingAsset, setPendingAsset] = useState(null);
  const [pendingLiability, setPendingLiability] = useState(null);
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

  const scrollToPatrimonyCatalog = useCallback(() => {
    document.getElementById('patrimony-assets')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, []);

  return (
    <div className={ui.stackPage}>
      {alerts.length > 0 ? (
        <FinanceAlerts alerts={alerts} className={ui.chartCard} />
      ) : null}

      {hasAccounts && monthlyClose?.pendingMonths?.length ? (
        <MonthlyClosePrompt status={monthlyClose} onCloseMonth={openRecordBalances} />
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
        assets={assets}
        pendingAsset={pendingAsset}
        setPendingAsset={setPendingAsset}
        addAsset={addAsset}
        updateAsset={updateAsset}
        setAssetActive={setAssetActive}
        removeAsset={removeAsset}
        saveToCloud={saveToCloud}
        saveStatus={saveStatus}
        canCloudSave={canCloudSave}
      />

      <PatrimonyLiabilitiesSection
        liabilities={liabilities}
        pendingLiability={pendingLiability}
        setPendingLiability={setPendingLiability}
        addLiability={addLiability}
        updateLiability={updateLiability}
        setLiabilityActive={setLiabilityActive}
        removeLiability={removeLiability}
        saveToCloud={saveToCloud}
        saveStatus={saveStatus}
        canCloudSave={canCloudSave}
      />

      <section className={`${ui.chartCard} ${ui.stackSection}`}>
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

      <MonthlyCloseModal
        open={balancesOpen}
        onClose={() => setBalancesOpen(false)}
        assets={assets}
        liabilities={liabilities}
        snapshots={snapshots}
        monthKey={balancesMonthKey}
        onMonthKeyChange={setBalancesMonthKey}
        onConfirm={closeMonthSnapshots}
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
  const label = pendingMonths
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
  assets,
  pendingAsset,
  setPendingAsset,
  addAsset,
  updateAsset,
  setAssetActive,
  removeAsset,
  saveToCloud,
  saveStatus,
  canCloudSave,
}) {
  const { t } = useTranslation();

  const handleSave = async () => {
    if (pendingAsset && isSavableAsset(pendingAsset)) {
      addAsset(createAsset(pendingAsset));
      setPendingAsset(null);
    }
    await saveToCloud();
  };

  const showList = assets.length > 0;
  const showEmpty = !pendingAsset && assets.length === 0;

  return (
    <section
      id="patrimony-assets"
      className={`${ui.chartCard} ${ui.stackSection} scroll-mt-24`}
    >
      <SectionHeader
        title={t('balance.patrimony.assetsTitle')}
        subtitle={t('balance.patrimony.assetsSubtitle')}
        hint={t('balance.patrimony.saveHint')}
      />

      {pendingAsset ? (
        <ul className={ui.stackBlocks}>
          <AssetCard
            asset={pendingAsset}
            onChange={(patch) =>
              setPendingAsset((prev) => ({ ...prev, ...patch }))
            }
            onToggleActive={(isActive) =>
              setPendingAsset((prev) => ({ ...prev, isActive }))
            }
          />
        </ul>
      ) : null}

      {showList ? (
        <ul className={ui.stackBlocks}>
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onChange={(patch) => updateAsset(asset.id, patch)}
              onToggleActive={(isActive) => setAssetActive(asset.id, isActive)}
              onRemove={() => removeAsset(asset.id)}
            />
          ))}
        </ul>
      ) : null}

      {showEmpty ? (
        <EmptyBlock message={t('balance.patrimony.assetsEmpty')} />
      ) : null}

      <PatrimonySectionActions
        pending={Boolean(pendingAsset)}
        saveDisabled={pendingAsset ? !isSavableAsset(pendingAsset) : false}
        saveLabel={
          pendingAsset
            ? t('balance.patrimony.saveAsset')
            : t('balance.patrimony.saveChanges')
        }
        onSave={handleSave}
        onCancel={() => setPendingAsset(null)}
        onStartAdd={() =>
          setPendingAsset(
            createAsset({ name: t('balance.patrimony.newAsset') }),
          )
        }
        addFirstLabel={t('balance.patrimony.addFirstAsset')}
        addAnotherLabel={t('balance.patrimony.addAnotherAsset')}
        showAddAnother={!pendingAsset && assets.length > 0}
        showAddFirst={!pendingAsset && assets.length === 0}
        showSave={pendingAsset || assets.length > 0}
        saveStatus={saveStatus}
        canCloudSave={canCloudSave}
      />
    </section>
  );
}

function PatrimonyLiabilitiesSection({
  liabilities,
  pendingLiability,
  setPendingLiability,
  addLiability,
  updateLiability,
  setLiabilityActive,
  removeLiability,
  saveToCloud,
  saveStatus,
  canCloudSave,
}) {
  const { t } = useTranslation();

  const handleSave = async () => {
    if (pendingLiability && isSavableLiability(pendingLiability)) {
      addLiability(createLiability(pendingLiability));
      setPendingLiability(null);
    }
    await saveToCloud();
  };

  const showList = liabilities.length > 0;
  const showEmpty = !pendingLiability && liabilities.length === 0;

  return (
    <section className={`${ui.chartCard} ${ui.stackSection}`}>
      <SectionHeader
        title={t('balance.patrimony.liabilitiesTitle')}
        subtitle={t('balance.patrimony.liabilitiesSubtitle')}
        hint={t('balance.patrimony.saveHint')}
      />

      {pendingLiability ? (
        <ul className={ui.stackBlocks}>
          <LiabilityCard
            liability={pendingLiability}
            onChange={(patch) =>
              setPendingLiability((prev) => ({ ...prev, ...patch }))
            }
            onToggleActive={(isActive) =>
              setPendingLiability((prev) => ({ ...prev, isActive }))
            }
          />
        </ul>
      ) : null}

      {showList ? (
        <ul className={ui.stackBlocks}>
          {liabilities.map((liability) => (
            <LiabilityCard
              key={liability.id}
              liability={liability}
              onChange={(patch) => updateLiability(liability.id, patch)}
              onToggleActive={(isActive) =>
                setLiabilityActive(liability.id, isActive)
              }
              onRemove={() => removeLiability(liability.id)}
            />
          ))}
        </ul>
      ) : null}

      {showEmpty ? (
        <EmptyBlock message={t('balance.patrimony.liabilitiesEmpty')} />
      ) : null}

      <PatrimonySectionActions
        pending={Boolean(pendingLiability)}
        saveDisabled={
          pendingLiability ? !isSavableLiability(pendingLiability) : false
        }
        saveLabel={
          pendingLiability
            ? t('balance.patrimony.saveLiability')
            : t('balance.patrimony.saveChanges')
        }
        onSave={handleSave}
        onCancel={() => setPendingLiability(null)}
        onStartAdd={() =>
          setPendingLiability(
            createLiability({ name: t('balance.patrimony.newLiability') }),
          )
        }
        addFirstLabel={t('balance.patrimony.addFirstLiability')}
        addAnotherLabel={t('balance.patrimony.addAnotherLiability')}
        showAddAnother={!pendingLiability && liabilities.length > 0}
        showAddFirst={!pendingLiability && liabilities.length === 0}
        showSave={pendingLiability || liabilities.length > 0}
        saveStatus={saveStatus}
        canCloudSave={canCloudSave}
      />
    </section>
  );
}

function PatrimonySectionActions({
  pending,
  saveDisabled,
  saveLabel,
  onSave,
  onCancel,
  onStartAdd,
  addFirstLabel,
  addAnotherLabel,
  showAddFirst,
  showAddAnother,
  showSave,
  saveStatus,
  canCloudSave,
}) {
  const { t } = useTranslation();

  return (
    <div className={`space-y-3 border-t pt-4 ${ui.divider}`}>
      <div className="flex flex-wrap items-center gap-3">
        {pending ? (
          <>
            <button
              type="button"
              className={ui.btnPrimary}
              disabled={saveDisabled || saveStatus === 'saving'}
              onClick={onSave}
            >
              {saveStatus === 'saving' ? t('balance.patrimony.saving') : saveLabel}
            </button>
            <button type="button" className={ui.btnSecondary} onClick={onCancel}>
              {t('common.cancel')}
            </button>
          </>
        ) : (
          <>
            {showAddFirst ? (
              <button type="button" className={ui.btnSecondary} onClick={onStartAdd}>
                {addFirstLabel}
              </button>
            ) : null}
            {showAddAnother ? (
              <button type="button" className={ui.btnSecondary} onClick={onStartAdd}>
                {addAnotherLabel}
              </button>
            ) : null}
            {showSave ? (
              <button
                type="button"
                className={ui.btnPrimary}
                disabled={saveStatus === 'saving'}
                onClick={onSave}
              >
                {saveStatus === 'saving'
                  ? t('balance.patrimony.saving')
                  : saveLabel}
              </button>
            ) : null}
          </>
        )}
      </div>
      <SaveStatusLine status={saveStatus} canCloudSave={canCloudSave} />
    </div>
  );
}

function SaveStatusLine({ status, canCloudSave }) {
  const { t } = useTranslation();
  if (status === 'saving') return null;
  if (status === 'saved') {
    return (
      <p className={`text-sm ${ui.accentSoft}`}>
        {canCloudSave
          ? t('balance.patrimony.savedCloud')
          : t('balance.patrimony.savedLocal')}
      </p>
    );
  }
  if (status === 'error') {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        {t('balance.patrimony.saveError')}
      </p>
    );
  }
  return null;
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

function AssetCard({ asset, onChange, onToggleActive, onRemove }) {
  const { t } = useTranslation();
  const categories = getAssetCategories(t);
  const inactive = asset.isActive === false;

  return (
    <li
      className={`${ui.block} ${ui.stackSection} p-4 sm:p-5 ${inactive ? 'opacity-60' : ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={asset.isActive !== false}
            onChange={(e) => onToggleActive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-400 text-emerald-500 focus:ring-emerald-500/40"
          />
          <span className={`text-sm font-medium ${ui.textLabel}`}>
            {t('balance.patrimony.activeInClose')}
          </span>
        </label>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className={`text-sm font-medium text-red-600 hover:underline dark:text-red-400`}
          >
            {t('balance.patrimony.removeAsset')}
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormFieldFrame
          label={t('balance.patrimony.name')}
          required
          reserveHintSpace={false}
          className="md:col-span-2"
        >
          <input
            type="text"
            value={asset.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className={`${ui.input} w-full`}
          />
        </FormFieldFrame>

        <FormFieldFrame label={t('balance.patrimony.category')} reserveHintSpace={false}>
          <SelectField
            variant="input"
            className="w-full py-2.5"
            value={asset.category}
            onChange={(e) => onChange({ category: e.target.value })}
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </SelectField>
        </FormFieldFrame>

        <div className="flex min-w-0 flex-col gap-1.5 md:col-span-2">
          <FormFieldFrame
            label={t('balance.patrimony.provider')}
            reserveHintSpace={false}
          >
            <InstitutionSelect
              institutionIds={SPANISH_BANK_IDS}
              i18nKey="balance.banks"
              legacyMap={SPANISH_BANK_LEGACY_LABELS}
              value={asset.provider ?? ''}
              onChange={(provider) => onChange({ provider })}
            />
          </FormFieldFrame>
          <p className={`text-xs leading-snug ${ui.textMuted}`}>
            {t('balance.patrimony.providerHint')}
          </p>
        </div>

        <FormFieldFrame
          label={t('balance.patrimony.notes')}
          reserveHintSpace={false}
          className="md:col-span-2"
        >
          <input
            type="text"
            value={asset.notes ?? ''}
            placeholder={t('common.optional')}
            onChange={(e) => onChange({ notes: e.target.value })}
            className={`${ui.input} w-full`}
          />
        </FormFieldFrame>
      </div>
    </li>
  );
}

function LiabilityCard({ liability, onChange, onToggleActive, onRemove }) {
  const { t } = useTranslation();
  const categories = getLiabilityCategories(t);
  const inactive = liability.isActive === false;

  return (
    <li
      className={`${ui.block} ${ui.stackSection} p-4 sm:p-5 ${inactive ? 'opacity-60' : ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={liability.isActive !== false}
            onChange={(e) => onToggleActive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-400 text-emerald-500 focus:ring-emerald-500/40"
          />
          <span className={`text-sm font-medium ${ui.textLabel}`}>
            {t('balance.patrimony.activeInClose')}
          </span>
        </label>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className={`text-sm font-medium text-red-600 hover:underline dark:text-red-400`}
          >
            {t('balance.patrimony.removeLiability')}
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormFieldFrame
          label={t('balance.patrimony.name')}
          required
          reserveHintSpace={false}
          className="md:col-span-2"
        >
          <input
            type="text"
            value={liability.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className={`${ui.input} w-full`}
          />
        </FormFieldFrame>

        <FormFieldFrame label={t('balance.patrimony.category')} reserveHintSpace={false}>
          <SelectField
            variant="input"
            className="w-full py-2.5"
            value={liability.category}
            onChange={(e) => onChange({ category: e.target.value })}
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </SelectField>
        </FormFieldFrame>

        <div className="flex min-w-0 flex-col gap-1.5">
          <FormFieldFrame
            label={t('balance.patrimony.monthlyPayment')}
            reserveHintSpace={false}
          >
            <input
              type="number"
              min={0}
              step="10"
              value={liability.monthlyPayment ?? 0}
              onChange={(e) =>
                onChange({
                  monthlyPayment: Math.max(0, parseFloat(e.target.value) || 0),
                })
              }
              className={`${ui.input} ${ui.inputAmount}`}
            />
          </FormFieldFrame>
          <p className={`text-xs leading-snug ${ui.textMuted}`}>
            {t('balance.patrimony.monthlyPaymentHint')}
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5 md:col-span-2">
          <FormFieldFrame
            label={t('balance.patrimony.interestRate')}
            reserveHintSpace={false}
          >
            <input
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={liability.interestRate ?? ''}
              placeholder="—"
              onChange={(e) => {
                const raw = e.target.value;
                onChange({
                  interestRate:
                    raw === '' ? undefined : Math.max(0, parseFloat(raw) || 0),
                });
              }}
              className={`${ui.input} ${ui.inputAmount}`}
            />
          </FormFieldFrame>
          <p className={`text-xs leading-snug ${ui.textMuted}`}>
            {t('balance.patrimony.interestRateHint')}
          </p>
        </div>
      </div>
    </li>
  );
}
