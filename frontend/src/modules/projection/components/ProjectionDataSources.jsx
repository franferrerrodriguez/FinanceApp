import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { IneInflationBlock } from './IneInflationBlock';
import { Link } from 'react-router-dom';
import { BALANCE_TAB, balancePath } from '../../../lib/balanceTabs';
import { getEffectiveBudgetInvestment } from '../../../lib/calculations';
import { getCashflowTotalsForDate } from '../../../lib/cashflowHistory';
import { getCurrentMonthKey } from '../../../lib/cashflowHistory';
import {
  getAverageContributionsByAsset,
  resolveEntriesForMonth,
  resolveInvestmentFromBreakdown,
} from '../../../lib/contributionEntries';
import { hasProjectionContributionData } from '../../../lib/contributionProjection';
import {
  GROWTH_BUCKETS,
  buildInitialBucketState,
  getProjectionStartingPatrimony,
} from '../../../lib/projectionBuckets';
import { ui } from '../../../lib/uiClasses';
import { useFinanceData } from '../../../store/hooks';
import { formatMoney, formatPercent } from '../../../utils/formatters';

export function ProjectionDataSources() {
  const { t } = useTranslation();
  const {
    settings,
    contributionPlans,
    contributionEntries,
    cashflowHistory,
    assets,
    liabilities,
    snapshots,
  } = useFinanceData();

  const totals = useMemo(
    () => getCashflowTotalsForDate(settings, cashflowHistory, new Date()),
    [settings, cashflowHistory],
  );

  const monthKey = getCurrentMonthKey();
  const actualMonth = resolveEntriesForMonth(contributionEntries, monthKey, assets);
  const projectedFromHistory = getAverageContributionsByAsset(
    contributionEntries,
    assets,
    { lookbackMonths: 3 },
  );
  const budgetInvestment = getEffectiveBudgetInvestment(settings);
  const investments =
    actualMonth.total > 0
      ? resolveInvestmentFromBreakdown(actualMonth.breakdown)
      : resolveInvestmentFromBreakdown(projectedFromHistory.breakdown) ||
        budgetInvestment;

  const hasInvestments = hasProjectionContributionData({
    entries: contributionEntries,
    contributionPlans,
    assets,
    snapshots,
    settings,
  });

  const initialState = useMemo(
    () =>
      buildInitialBucketState({
        settings,
        assets,
        liabilities,
        snapshots,
        initialPatrimony: settings.initialPatrimony ?? 0,
      }),
    [settings, assets, liabilities, snapshots],
  );

  const startingPatrimony = useMemo(
    () =>
      getProjectionStartingPatrimony({
        settings,
        assets,
        liabilities,
        snapshots,
      }),
    [settings, assets, liabilities, snapshots],
  );

  const activeBuckets = GROWTH_BUCKETS.filter(
    (bucket) => (initialState.buckets[bucket] ?? 0) > 0,
  );

  const monthlyExpenses =
    totals.coreFixed + totals.groceries + totals.leisure;

  const sourcesGridClass = hasInvestments
    ? 'grid gap-3 sm:grid-cols-2 xl:grid-cols-4'
    : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <section className={`${ui.chartCard} space-y-4`}>
      <div>
        <h3 className={`text-base font-semibold ${ui.heading}`}>
          {t('projection.sources.title')}
        </h3>
        <p className={`mt-1 text-sm ${ui.text}`}>
          {t('projection.sources.hint')}
        </p>
      </div>

      <dl className={sourcesGridClass}>
        <CashflowSummaryBlock
          income={totals.income}
          coreFixed={totals.coreFixed}
          groceries={totals.groceries}
          leisure={totals.leisure}
          expensesTotal={monthlyExpenses}
          savings={totals.savings}
        />
        <SourceItem
          label={t('projection.sources.patrimony')}
          value={formatMoney(startingPatrimony)}
          hint={
            initialState.fromSnapshots
              ? t('projection.sources.patrimonyFromSnapshots')
              : t('projection.sources.patrimonyManual')
          }
          editTo={
            initialState.fromSnapshots
              ? balancePath(BALANCE_TAB.PATRIMONY)
              : '#projection-settings'
          }
          editLabel={
            initialState.fromSnapshots
              ? t('projection.sources.editInPatrimony')
              : t('projection.sources.editInSettings')
          }
        />
        <IneInflationBlock />
        {hasInvestments ? (
          <SourceItem
            label={t('projection.sources.investments')}
            value={formatMoney(investments)}
            hint={
              actualMonth.total > 0
                ? t('projection.sources.investmentsFromActual')
                : projectedFromHistory.total > 0
                  ? t('projection.sources.investmentsFromHistory')
                  : t('projection.sources.investmentsFromBudget')
            }
            editLabel={
              budgetInvestment > 0 && projectedFromHistory.total <= 0
                ? t('projection.sources.editInCashflow')
                : t('projection.sources.editInPatrimony')
            }
            editTo={
              budgetInvestment > 0 && projectedFromHistory.total <= 0
                ? balancePath(BALANCE_TAB.CASHFLOW)
                : balancePath(BALANCE_TAB.PATRIMONY)
            }
          />
        ) : null}
      </dl>

      {activeBuckets.length > 0 ? (
        <div className={`rounded-xl border px-4 py-3 ${ui.cardMuted}`}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className={`text-xs font-medium ${ui.textMuted}`}>
                {t('projection.sources.bucketBreakdown')}
              </p>
              <p className={`mt-1 text-xs ${ui.textMuted}`}>
                {t('projection.sources.bucketBreakdownHint')}
              </p>
            </div>
            <Link
              to={balancePath(BALANCE_TAB.PATRIMONY)}
              className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
            >
              {t('projection.sources.editReturns')}
            </Link>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm">
            {activeBuckets.map((bucket) => (
              <li
                key={bucket}
                className="flex items-baseline justify-between gap-3 tabular-nums"
              >
                <span className={ui.textLabel}>
                  {t(`projection.buckets.${bucket}`)}
                </span>
                <span className={`shrink-0 font-medium ${ui.heading}`}>
                  {formatMoney(initialState.buckets[bucket])}{' '}
                  <span className={`text-xs font-normal ${ui.textMuted}`}>
                    @ {formatPercent(initialState.bucketRates[bucket] ?? 0)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!hasInvestments ? (
        <p
          className={`rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100`}
        >
          {t('projection.sources.noContributions')}
        </p>
      ) : null}
    </section>
  );
}

function CashflowSummaryBlock({
  income,
  coreFixed,
  groceries,
  leisure,
  expensesTotal,
  savings,
}) {
  const { t } = useTranslation();

  return (
    <div className={`rounded-xl border px-4 py-3 ${ui.cardMuted}`}>
      <p className={`text-xs font-medium ${ui.textMuted}`}>
        {t('projection.sources.cashflow')}
      </p>
      <dl className="mt-2 space-y-1 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className={ui.textMuted}>{t('projection.sources.income')}</dt>
          <dd className={`font-medium tabular-nums ${ui.heading}`}>
            {formatMoney(income)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 pl-2">
          <dt className={ui.textMuted}>{t('projection.sources.expensesCoreFixed')}</dt>
          <dd className={`font-medium tabular-nums ${ui.heading}`}>
            {formatMoney(coreFixed)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 pl-2">
          <dt className={ui.textMuted}>{t('projection.sources.expensesGroceries')}</dt>
          <dd className={`font-medium tabular-nums ${ui.heading}`}>
            {formatMoney(groceries)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 pl-2">
          <dt className={ui.textMuted}>{t('projection.sources.expensesLeisure')}</dt>
          <dd className={`font-medium tabular-nums ${ui.heading}`}>
            {formatMoney(leisure)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className={ui.textMuted}>{t('projection.sources.expenses')}</dt>
          <dd className={`font-medium tabular-nums ${ui.heading}`}>
            {formatMoney(expensesTotal)}
          </dd>
        </div>
        <div
          className={`flex items-baseline justify-between gap-3 border-t pt-1.5 ${ui.divider}`}
        >
          <dt className={`font-medium ${ui.textLabel}`}>
            {t('projection.sources.monthlySavings')}
          </dt>
          <dd className={`font-bold tabular-nums ${ui.heading}`}>
            {formatMoney(savings)}
          </dd>
        </div>
      </dl>
      <Link
        to={balancePath(BALANCE_TAB.CASHFLOW)}
        className="mt-2 inline-block text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
      >
        {t('projection.sources.edit')}
      </Link>
    </div>
  );
}

function SourceItem({ label, value, hint, editTo, editLabel }) {
  const { t } = useTranslation();
  const linkText = editLabel ?? t('projection.sources.edit');

  return (
    <div className={`rounded-xl border px-4 py-3 ${ui.cardMuted}`}>
      <dt className={`text-xs font-medium ${ui.textMuted}`}>{label}</dt>
      <dd className={`mt-1 text-lg font-bold tabular-nums ${ui.heading}`}>
        {value}
      </dd>
      {hint ? (
        <p className={`mt-1 text-xs leading-snug ${ui.textMuted}`}>{hint}</p>
      ) : null}
      {editTo ? (
        <Link
          to={editTo}
          className="mt-2 inline-block text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
        >
          {linkText}
        </Link>
      ) : null}
    </div>
  );
}
