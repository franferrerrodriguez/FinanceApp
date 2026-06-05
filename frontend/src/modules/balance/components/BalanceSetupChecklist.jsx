import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BALANCE_TAB, balancePath } from '../../../lib/balanceTabs';
import {
  BALANCE_SETUP_STEP,
  getBalanceSetupProgress,
} from '../../../lib/balanceSetupProgress';
import { ui } from '../../../lib/uiClasses';
import { useFinanceData } from '../../../store/hooks';

const STEP_TAB = {
  [BALANCE_SETUP_STEP.ACCOUNTS]: BALANCE_TAB.PATRIMONY,
  [BALANCE_SETUP_STEP.CASHFLOW]: BALANCE_TAB.CASHFLOW,
  [BALANCE_SETUP_STEP.INVEST]: BALANCE_TAB.CONTRIBUTIONS,
};

function StepRow({ stepNumber, label, hint, complete, actionLabel, to, isNext }) {
  return (
    <li
      className={`flex flex-wrap items-start justify-between gap-3 rounded-xl border px-4 py-3 ${
        isNext && !complete
          ? 'border-emerald-300 bg-emerald-50/80 dark:border-emerald-700/60 dark:bg-emerald-950/30'
          : ui.cardInset
      }`}
    >
      <div className="flex min-w-0 flex-1 gap-3">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
            complete
              ? 'bg-emerald-500 text-white'
              : 'border border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300'
          }`}
          aria-hidden
        >
          {complete ? '✓' : stepNumber}
        </span>
        <div className="min-w-0">
          <p className={`text-sm font-medium ${ui.textLabel}`}>{label}</p>
          <p className={`mt-0.5 text-sm ${ui.textMuted}`}>{hint}</p>
        </div>
      </div>
      {!complete ? (
        <Link
          to={to}
          className={`shrink-0 ${ui.btnSecondary} text-sm`}
        >
          {actionLabel}
        </Link>
      ) : null}
    </li>
  );
}

export function BalanceSetupChecklist() {
  const { t } = useTranslation();
  const { settings, assets, snapshots, contributionPlans } = useFinanceData();
  const progress = getBalanceSetupProgress({
    settings,
    assets,
    snapshots,
    contributionPlans,
  });

  if (progress.allComplete) return null;

  const stepMeta = (id) => {
    const complete = progress.steps.find((s) => s.id === id)?.complete ?? false;
    return {
      complete,
      isNext: progress.nextStepId === id,
      to: balancePath(STEP_TAB[id]),
    };
  };

  const accounts = stepMeta(BALANCE_SETUP_STEP.ACCOUNTS);
  const cashflow = stepMeta(BALANCE_SETUP_STEP.CASHFLOW);
  const invest = stepMeta(BALANCE_SETUP_STEP.INVEST);

  return (
    <section
      className={`${ui.chartCard} ${ui.stackSection}`}
      aria-labelledby="balance-setup-title"
    >
      <div>
        <h3
          id="balance-setup-title"
          className={`text-base font-semibold ${ui.heading}`}
        >
          {t('balance.setup.title')}
        </h3>
        <p className={`mt-1 text-sm ${ui.text}`}>
          {t('balance.setup.subtitle', {
            done: progress.completeCount,
            total: progress.steps.length,
          })}
        </p>
      </div>

      <ol className={`list-none ${ui.stackBlocks}`}>
        <StepRow
          stepNumber={1}
          label={t('balance.setup.steps.accounts.label')}
          hint={t('balance.setup.steps.accounts.hint')}
          actionLabel={t('balance.setup.action')}
          {...accounts}
        />
        <StepRow
          stepNumber={2}
          label={t('balance.setup.steps.cashflow.label')}
          hint={t('balance.setup.steps.cashflow.hint')}
          actionLabel={t('balance.setup.action')}
          {...cashflow}
        />
        <StepRow
          stepNumber={3}
          label={t('balance.setup.steps.invest.label')}
          hint={t('balance.setup.steps.invest.hint')}
          actionLabel={t('balance.setup.action')}
          {...invest}
        />
      </ol>
    </section>
  );
}
