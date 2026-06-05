import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext';
import { BALANCE_TAB, balancePath } from '../../../lib/balanceTabs';
import { calcMonthlySavingsFromSettings } from '../../../lib/balanceSetupProgress';
import { filterDraftAssets } from '../../../lib/patrimonyDrafts';
import {
  createContributionPlan,
  getContributionEligibleAssets,
  getTotalMonthlyContributions,
  getWeightedReturnSummary,
  hasActiveContributionAmounts,
  resolveInvestmentContributionsForMonth,
  resolveLinkedAsset,
  syncPlanWithAsset,
} from '../../../lib/contributionPlans';
import { ui } from '../../../lib/uiClasses';
import { useFinanceData } from '../../../store/hooks';
import { formatMoney, formatPercent } from '../../../utils/formatters';
import { ContributionDeleteConfirmModal } from './ContributionDeleteConfirmModal';
import { ContributionEditModal } from './ContributionEditModal';
import { ContributionsTable } from './ContributionsTable';

export function ContributionsPanel() {
  const { t } = useTranslation();
  const toast = useToast();
  const {
    settings,
    assets,
    contributionPlans,
    addContributionPlan,
    updateContributionPlan,
    removeContributionPlan,
  } = useFinanceData();

  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const total = getTotalMonthlyContributions(contributionPlans);
  const returnSummary = getWeightedReturnSummary(
    settings,
    contributionPlans,
    assets,
  );
  const hasAmounts = hasActiveContributionAmounts(contributionPlans);
  const monthlySavings = calcMonthlySavingsFromSettings(settings);
  const plannedInvest = resolveInvestmentContributionsForMonth(
    contributionPlans,
    0,
  );
  const staysInBank = Math.round((monthlySavings - plannedInvest) * 100) / 100;
  const planExceedsSavings = plannedInvest > monthlySavings + 0.005;
  const showAllocation = activeAccounts.length > 0 || plannedInvest > 0;
  const activeAccounts = filterDraftAssets(assets).filter(
    (a) => a.isActive !== false,
  );
  const eligibleForNew = getContributionEligibleAssets(
    assets,
    null,
    contributionPlans,
  );
  const canAdd = eligibleForNew.length > 0;
  const allDestinationsUsed =
    activeAccounts.length > 0 && !canAdd && contributionPlans.length > 0;

  const openCreate = () => {
    const first = getContributionEligibleAssets(assets, null, contributionPlans)[0];
    if (!first) return;
    const draft = syncPlanWithAsset(
      createContributionPlan({ monthlyAmount: 0 }),
      first,
    );
    setModal({ mode: 'create', draft });
  };

  const openEdit = (plan) =>
    setModal({ mode: 'edit', planId: plan.id, draft: { ...plan } });

  const closeModal = () => setModal(null);

  const handleModalSave = (draft) => {
    if (modal?.mode === 'create') {
      addContributionPlan(draft);
      toast.success(t('toast.contributionAdded'));
    } else {
      updateContributionPlan(modal.planId, draft);
      toast.success(t('toast.contributionUpdated'));
    }
    closeModal();
  };

  const requestDelete = (plan) => setDeleteTarget(plan);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (modal?.mode === 'edit' && modal.planId === deleteTarget.id) {
      closeModal();
    }
    removeContributionPlan(deleteTarget.id);
    setDeleteTarget(null);
    toast.success(t('toast.contributionRemoved'));
  };

  const handleModalDelete = () => {
    if (modal?.mode !== 'edit') return;
    const plan = contributionPlans.find((p) => p.id === modal.planId);
    if (plan) requestDelete(plan);
  };

  const handleToggleActive = (id, isActive) => {
    updateContributionPlan(id, { isActive });
  };

  const deleteItemName =
    deleteTarget &&
    (resolveLinkedAsset(deleteTarget, assets)?.name ??
      t('balance.contributions.unnamedAsset'));

  return (
    <div className={ui.stackPage}>
      <div className={`${ui.chartCard} ${ui.stackSection}`}>
        <div>
          <h3 className={`text-base font-semibold ${ui.heading}`}>
            {t('balance.contributions.title')}
          </h3>
          <p className={`mt-1 text-sm ${ui.text}`}>
            {t('balance.contributions.subtitle')}
          </p>
        </div>

        <p className={`rounded-xl border px-4 py-3 text-sm ${ui.cardMuted}`}>
          {t('balance.contributions.scopeNote')}
        </p>

        {showAllocation ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              planExceedsSavings
                ? 'border-amber-300 bg-amber-50/90 text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/35 dark:text-amber-100'
                : ui.cardMuted
            }`}
          >
            <p className={ui.textLabel}>
              {t('balance.contributions.allocationTitle')}
            </p>
            <p className={`mt-1.5 ${ui.text}`}>
              {t('balance.contributions.allocationLine', {
                savings: formatMoney(monthlySavings),
                planned: formatMoney(plannedInvest),
                bank: formatMoney(Math.max(0, staysInBank)),
              })}
            </p>
            {planExceedsSavings ? (
              <p className="mt-2 text-amber-800 dark:text-amber-200">
                {t('balance.contributions.allocationOverBudget')}
              </p>
            ) : (
              <p className={`mt-2 text-xs ${ui.textMuted}`}>
                {t('balance.contributions.allocationHint')}
              </p>
            )}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Stat
            label={t('balance.contributions.totalMonthly')}
            value={formatMoney(total)}
            hint={
              hasAmounts
                ? t('balance.contributions.totalMonthlyHint')
                : t('balance.contributions.totalMonthlyEmpty')
            }
          />
          {hasAmounts ? (
            <Stat
              label={t('balance.contributions.weightedReturn')}
              value={formatPercent(returnSummary.rate)}
              hint={t('balance.contributions.weightedReturnHint')}
            />
          ) : null}
        </div>
      </div>

      <section className={`${ui.chartCard} ${ui.stackSection}`}>
        <div className={`border-b pb-3 ${ui.divider}`}>
          <h3 className={`text-base font-semibold ${ui.heading}`}>
            {t('balance.contributions.plansTitle')}
          </h3>
          <p className={`mt-1 text-sm ${ui.textMuted}`}>
            {t('balance.contributions.plansSubtitle')}
          </p>
        </div>

        {activeAccounts.length === 0 && contributionPlans.length === 0 ? (
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
        ) : contributionPlans.length === 0 ? (
          <div className={`px-6 py-8 text-center ${ui.cardDashed}`}>
            <p className={ui.text}>{t('balance.contributions.empty')}</p>
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
            plans={contributionPlans}
            assets={assets}
            settings={settings}
            onEdit={openEdit}
            onDelete={requestDelete}
            onToggleActive={handleToggleActive}
          />
        )}

        {allDestinationsUsed ? (
          <div className="space-y-3">
            <p className={`text-sm ${ui.textMuted}`}>
              {t('balance.contributions.allDestinationsUsed')}
            </p>
            <Link
              to={balancePath(BALANCE_TAB.PATRIMONY)}
              className={`inline-flex ${ui.btnSecondary}`}
            >
              {t('balance.contributions.goAddFund')}
            </Link>
          </div>
        ) : null}

        {canAdd && contributionPlans.length > 0 ? (
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
        planId={modal?.planId}
        initialDraft={modal?.draft ?? createContributionPlan()}
        assets={assets}
        contributionPlans={contributionPlans}
        settings={settings}
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
