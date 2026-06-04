import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  calcTotalFixedExpenses,
  calcTotalIncome,
  calcTotalVariableExpenses,
} from '../../../lib/calculations';
import {
  getTotalMonthlyContributions,
  hasProjectionInvestmentPlans,
  resolveInvestmentContributionsForMonth,
} from '../../../lib/contributionPlans';
import { getProjectionAnnualRate } from '../../../lib/projectionRates';
import { ui } from '../../../lib/uiClasses';
import { useFinanceData } from '../../../store/hooks';
import { formatMoney, formatPercent } from '../../../utils/formatters';

export function ProjectionDataSources() {
  const { t } = useTranslation();
  const { settings, contributionPlans, salaryHistory } = useFinanceData();

  const income = calcTotalIncome(settings);
  const fixed = calcTotalFixedExpenses(settings);
  const variable = calcTotalVariableExpenses(settings);
  const investments = resolveInvestmentContributionsForMonth(
    contributionPlans,
    0,
  );
  const annualRate = getProjectionAnnualRate(settings);

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

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SourceItem
          label={t('projection.sources.income')}
          value={formatMoney(income)}
          editTo="/balance?tab=cashflow"
        />
        <SourceItem
          label={t('projection.sources.fixed')}
          value={formatMoney(fixed)}
          editTo="/balance?tab=cashflow"
        />
        <SourceItem
          label={t('projection.sources.variable')}
          value={formatMoney(variable)}
          editTo="/balance?tab=cashflow"
        />
        <SourceItem
          label={t('projection.sources.salaryHistory')}
          value={
            salaryHistory.length > 0
              ? t('projection.sources.salaryHistoryCount', {
                  count: salaryHistory.length,
                })
              : t('projection.sources.salaryHistoryFlat')
          }
          editTo="/balance?tab=cashflow"
        />
        <SourceItem
          label={t('projection.sources.expenseIncrease')}
          value={formatPercent(settings.projectionAnnualExpenseIncrease ?? 0)}
          editTo="/balance?tab=cashflow"
        />
        <SourceItem
          label={t('projection.sources.investments')}
          value={formatMoney(investments)}
          editTo="/balance?tab=contributions"
        />
        <SourceItem
          label={t('projection.sources.patrimony')}
          value={formatMoney(settings.initialPatrimony ?? 0)}
          editTo="/balance?tab=cashflow"
        />
        <SourceItem
          label={t('projection.sources.return')}
          value={formatPercent(annualRate)}
        />
      </dl>

      {!hasProjectionInvestmentPlans(contributionPlans) ? (
        <p
          className={`rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100`}
        >
          {t('projection.sources.noContributions')}
        </p>
      ) : (
        <p className={`text-xs ${ui.textMuted}`}>
          {t('projection.sources.contributionsTotal', {
            amount: formatMoney(getTotalMonthlyContributions(contributionPlans)),
          })}
        </p>
      )}
    </section>
  );
}

function SourceItem({ label, value, editTo }) {
  const { t } = useTranslation();

  return (
    <div className={`rounded-xl border px-4 py-3 ${ui.cardMuted}`}>
      <dt className={`text-xs font-medium ${ui.textMuted}`}>{label}</dt>
      <dd className={`mt-1 text-lg font-bold tabular-nums ${ui.heading}`}>
        {value}
      </dd>
      {editTo ? (
        <Link
          to={editTo}
          className="mt-2 inline-block text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
        >
          {t('projection.sources.editInPatrimony')}
        </Link>
      ) : null}
    </div>
  );
}
