import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext';
import { EffectiveMonthSelect } from '../../../components/EffectiveMonthSelect';
import { FormFieldFrame } from '../../../components/FormFieldFrame';
import { BALANCE_TAB, balancePath } from '../../../lib/balanceTabs';
import {
  BALANCE_SETUP_STEP,
  calcMonthlySavingsFromSettings,
} from '../../../lib/balanceSetupProgress';
import { getCurrentMonthKey } from '../../../lib/cashflowHistory';
import { FinanceAlerts } from '../../../components/FinanceAlerts';
import { useFinanceAlerts } from '../../../hooks/useFinanceAlerts';
import { filterDraftAssets } from '../../../lib/patrimonyDrafts';
import {
  createContributionEntry,
  getContributionEntryAssets,
  getEntriesForMonth,
  getMonthKeysFromEntries,
  getWeightedReturnFromBreakdown,
  resolveEntriesForMonth,
  resolveInvestmentFromBreakdown,
} from '../../../lib/contributionEntries';
import { ui } from '../../../lib/uiClasses';
import { useFinanceData, usePreferences } from '../../../store/hooks';
import { roundMoney } from '../../../lib/money';
import { formatMoney, formatPercent, formatRatePercent } from '../../../utils/formatters';
import { formatMonthKeyLong } from '../../../utils/monthLabel';
import { BalanceSetupStepBanner } from './BalanceSetupStepBanner';
import { ContributionDeleteConfirmModal } from './ContributionDeleteConfirmModal';
import { ContributionEditModal } from './ContributionEditModal';
import { ContributionsTable } from './ContributionsTable';

export function ContributionsPanel() {
  const { t } = useTranslation();
  const toast = useToast();
  const { locale } = usePreferences();
  const {
    settings,
    assets,
    contributionEntries,
    addContributionEntry,
    updateContributionEntry,
    removeContributionEntry,
  } = useFinanceData();

  const { alerts } = useFinanceAlerts();

  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const currentMonthKey = getCurrentMonthKey();
  const monthKeysFromData = useMemo(
    () => getMonthKeysFromEntries(contributionEntries),
    [contributionEntries],
  );
  const [monthKey, setMonthKey] = useState(currentMonthKey);

  const resolvedMonthKey = monthKey || currentMonthKey;
  const monthEntries = useMemo(
    () => getEntriesForMonth(contributionEntries, resolvedMonthKey),
    [contributionEntries, resolvedMonthKey],
  );
  const monthBreakdown = useMemo(
    () => resolveEntriesForMonth(contributionEntries, resolvedMonthKey, assets),
    [contributionEntries, resolvedMonthKey, assets],
  );
  const monthTotal = monthBreakdown.total;
  const monthInvest = resolveInvestmentFromBreakdown(monthBreakdown.breakdown);
  const returnSummary = getWeightedReturnFromBreakdown(
    settings,
    monthBreakdown.breakdown,
    assets,
  );
  const monthlySavings = calcMonthlySavingsFromSettings(settings);
  const staysInBank = roundMoney(monthlySavings - monthInvest);
  const exceedsSavings = monthInvest > monthlySavings + 0.005;
  const activeAccounts = filterDraftAssets(assets).filter(
    (a) => a.isActive !== false,
  );
  const canAdd = getContributionEntryAssets(assets).length > 0;
  const extraMonthKeys = useMemo(
    () => [...new Set([resolvedMonthKey, currentMonthKey, ...monthKeysFromData])],
    [resolvedMonthKey, currentMonthKey, monthKeysFromData],
  );

  const openCreate = () => {
    const first = getContributionEntryAssets(assets)[0];
    if (!first) return;
    const defaultDate =
      resolvedMonthKey === currentMonthKey
        ? new Date().toISOString().slice(0, 10)
        : `${resolvedMonthKey}-01`;
    setModal({
      mode: 'create',
      draft: createContributionEntry({ assetId: first.id, date: defaultDate }),
      defaultDate,
    });
  };

  const openEdit = (entry) =>
    setModal({ mode: 'edit', entryId: entry.id, draft: { ...entry } });

  const closeModal = () => setModal(null);

  const handleModalSave = (draft) => {
    if (modal?.mode === 'create') {
      addContributionEntry(draft);
      toast.success(t('toast.contributionAdded'));
    } else {
      updateContributionEntry(modal.entryId, draft);
      toast.success(t('toast.contributionUpdated'));
    }
    closeModal();
  };

  const requestDelete = (entry) => setDeleteTarget(entry);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (modal?.mode === 'edit' && modal.entryId === deleteTarget.id) {
      closeModal();
    }
    removeContributionEntry(deleteTarget.id);
    setDeleteTarget(null);
    toast.success(t('toast.contributionRemoved'));
  };

  const handleModalDelete = () => {
    if (modal?.mode !== 'edit') return;
    const entry = contributionEntries.find((e) => e.id === modal.entryId);
    if (entry) requestDelete(entry);
  };

  const deleteItemName =
    deleteTarget &&
    (assets.find((a) => a.id === deleteTarget.assetId)?.name ??
      t('balance.contributions.unnamedAsset'));

  return (
    <div className={ui.stackPage}>
      {alerts.length > 0 ? (
        <FinanceAlerts alerts={alerts} className={ui.chartCard} />
      ) : null}

      <BalanceSetupStepBanner
        stepId={BALANCE_SETUP_STEP.INVEST}
        onAction={canAdd ? openCreate : undefined}
      />

      <div className={`${ui.chartCard} ${ui.stackSection}`}>
        <div>
          <h3 className={`text-base font-semibold ${ui.heading}`}>
            {t('balance.contributions.title')}
          </h3>
          <p className={`mt-1 text-sm ${ui.text}`}>
            {t('balance.contributions.subtitle')}
          </p>
        </div>

        <FormFieldFrame label={t('balance.contributions.monthFilter')}>
          <EffectiveMonthSelect
            id="contributions-month-filter"
            wrapperClassName="w-full max-w-[12rem]"
            className="w-full py-2.5"
            value={resolvedMonthKey}
            extraMonthKeys={extraMonthKeys}
            lookbackMonths={48}
            onChange={setMonthKey}
            ariaLabel={t('balance.contributions.monthFilter')}
          />
          <p className={`mt-1.5 text-xs leading-relaxed ${ui.textMuted}`}>
            {formatMonthKeyLong(resolvedMonthKey, locale)}
          </p>
        </FormFieldFrame>

        {activeAccounts.length > 0 ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              exceedsSavings
                ? '[border:0.5px_solid_rgba(239,159,39,0.35)] bg-[rgba(239,159,39,0.10)] text-[var(--color-warning)]'
                : ui.cardMuted
            }`}
          >
            <p className={ui.textLabel}>{t('balance.contributions.monthSummaryTitle')}</p>
            <p className={`mt-1.5 ${ui.text}`}>
              {t('balance.contributions.monthSummaryLine', {
                total: formatMoney(monthTotal),
                invest: formatMoney(monthInvest),
                savings: formatMoney(monthlySavings),
                bank: formatMoney(Math.max(0, staysInBank)),
              })}
            </p>
            {exceedsSavings ? (
              <p className="mt-2 text-[var(--color-warning)]">
                {t('balance.contributions.allocationOverBudget')}
              </p>
            ) : (
              <p className={`mt-2 text-xs ${ui.textMuted}`}>
                {t('balance.contributions.monthSummaryHint')}
              </p>
            )}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Stat
            label={t('balance.contributions.monthTotal')}
            value={formatMoney(monthTotal)}
            hint={
              monthTotal > 0
                ? t('balance.contributions.monthTotalHint')
                : t('balance.contributions.monthTotalEmpty')
            }
          />
          {monthTotal > 0 ? (
            <Stat
              label={t('balance.contributions.weightedReturn')}
              value={formatRatePercent(returnSummary.rate)}
              hint={t('balance.contributions.weightedReturnHint')}
            />
          ) : null}
        </div>
      </div>

      <section className={`${ui.chartCard} ${ui.stackSection}`}>
        <div className={`border-b pb-3 ${ui.divider}`}>
          <h3 className={`text-base font-semibold ${ui.heading}`}>
            {t('balance.contributions.entriesTitle')}
          </h3>
          <p className={`mt-1 text-sm ${ui.textMuted}`}>
            {t('balance.contributions.entriesSubtitle')}
          </p>
        </div>

        {activeAccounts.length === 0 ? (
          <div className={`px-6 py-8 text-center ${ui.cardDashed}`}>
            <p className={ui.text}>{t('balance.contributions.noAccounts')}</p>
            <p className={`mt-2 text-sm ${ui.textMuted}`}>
              {t('balance.contributions.noAccountsHint')}
            </p>
            <Link
              to={balancePath(BALANCE_TAB.PATRIMONY)}
              className={`mt-4 inline-flex ${ui.btnPrimary}`}
            >
              {t('balance.contributions.goAddAccount')}
            </Link>
          </div>
        ) : monthEntries.length === 0 ? (
          <div className={`px-6 py-8 text-center ${ui.cardDashed}`}>
            <p className={ui.text}>{t('balance.contributions.emptyMonth')}</p>
            <button
              type="button"
              className={`mt-4 ${ui.btnPrimary}`}
              onClick={openCreate}
            >
              {t('balance.contributions.addFirst')}
            </button>
          </div>
        ) : (
          <ContributionsTable
            entries={monthEntries}
            assets={assets}
            locale={locale}
            onEdit={openEdit}
            onDelete={requestDelete}
          />
        )}

        {canAdd && monthEntries.length > 0 ? (
          <div className={`border-t pt-4 ${ui.divider}`}>
            <button type="button" className={ui.btnPrimary} onClick={openCreate}>
              {t('balance.contributions.addAnother')}
            </button>
          </div>
        ) : null}
      </section>

      <ContributionDeleteConfirmModal
        open={deleteTarget != null}
        itemName={deleteItemName ?? ''}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ContributionEditModal
        open={modal != null}
        mode={modal?.mode ?? 'create'}
        entryId={modal?.entryId}
        initialDraft={modal?.draft ?? createContributionEntry()}
        assets={assets}
        settings={settings}
        defaultDate={modal?.defaultDate}
        onClose={closeModal}
        onSave={handleModalSave}
        onDelete={handleModalDelete}
      />
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className={`${ui.block} px-3 py-2.5`}>
      <p className={`text-xs font-medium ${ui.textMuted}`}>{label}</p>
      <div className={`mt-1 text-lg font-bold ${ui.heading}`}>{value}</div>
      {hint ? <p className={`mt-1 text-xs ${ui.textMuted}`}>{hint}</p> : null}
    </div>
  );
}
