import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BALANCE_TAB, balancePath } from '../lib/balanceTabs';
import { BALANCE_SETUP_STEP } from '../lib/balanceSetupProgress';
import { hasPatrimonyAccounts } from '../lib/monthlyClose';
import { ui } from '../lib/uiClasses';
import { useFinanceData } from '../store/hooks';

const STEP_TAB = {
  [BALANCE_SETUP_STEP.ADD_ASSETS]: BALANCE_TAB.PATRIMONY,
  [BALANCE_SETUP_STEP.ACCOUNTS]: BALANCE_TAB.PATRIMONY,
  [BALANCE_SETUP_STEP.LIQUID]: BALANCE_TAB.PATRIMONY,
};

const STEP_NUMBER = {
  [BALANCE_SETUP_STEP.ADD_ASSETS]: 1,
  [BALANCE_SETUP_STEP.ACCOUNTS]: 2,
  [BALANCE_SETUP_STEP.LIQUID]: 3,
};

function getHintKey(stepId, hasAccounts) {
  if (stepId === BALANCE_SETUP_STEP.ACCOUNTS && hasAccounts) {
    return 'balance.setup.steps.accounts.hintBalances';
  }
  return `balance.setup.steps.${stepId}.hint`;
}

function SetupStepRow({
  stepNumber,
  label,
  hint,
  complete,
  optional,
  isNext,
  actionLabel,
  to,
  onAction,
}) {
  return (
    <li
      className={`flex flex-wrap items-start justify-between gap-3 rounded-xl px-4 py-3 ${
        isNext && !complete
          ? '[border:0.5px_solid_rgba(29,158,117,0.40)] bg-[rgba(29,158,117,0.08)]'
          : ui.cardInset
      }`}
    >
      <div className="flex min-w-0 flex-1 gap-3">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
            complete
              ? 'bg-[var(--accent)] text-white'
              : '[border:0.5px_solid_rgba(255,255,255,0.18)] text-[var(--text-secondary)]'
          }`}
          aria-hidden
        >
          {complete ? '✓' : stepNumber}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`text-sm font-medium ${ui.textLabel}`}>{label}</p>
            {optional ? (
              <span
                className={`rounded-full [border:0.5px_solid_rgba(255,255,255,0.12)] px-2 py-0.5 text-xs font-medium ${ui.textMuted}`}
              >
                {optional}
              </span>
            ) : null}
          </div>
          <p className={`mt-0.5 text-sm ${ui.textMuted}`}>{hint}</p>
        </div>
      </div>
      {!complete ? (
        onAction ? (
          <button
            type="button"
            onClick={onAction}
            className={`shrink-0 text-sm ${
              optional ? ui.btnSecondary : ui.btnPrimary
            }`}
          >
            {actionLabel}
          </button>
        ) : (
          <Link
            to={to}
            className={`shrink-0 text-sm ${
              optional ? ui.btnSecondary : ui.btnPrimary
            }`}
          >
            {actionLabel}
          </Link>
        )
      ) : null}
    </li>
  );
}

export function FinancePendingTasks({
  steps,
  completeCount,
  totalSteps,
  nextStepId,
  title,
  showSubtitle = true,
  className = '',
  onAction,
  onStepAction,
}) {
  const { t } = useTranslation();
  const { assets, liabilities } = useFinanceData();
  const hasAccounts = hasPatrimonyAccounts(assets, liabilities);

  if (!steps?.length) return null;
  if (completeCount === totalSteps) return null;

  return (
    <section
      className={`space-y-3 ${className}`}
      aria-labelledby="finance-setup-title"
    >
      <div>
        <h3
          id="finance-setup-title"
          className={`text-sm font-semibold ${ui.heading}`}
        >
          {title ?? t('balance.setup.title')}
        </h3>
        {showSubtitle ? (
          <p className={`mt-1 text-sm ${ui.textMuted}`}>
            {t('balance.setup.subtitle', {
              done: completeCount ?? steps.filter((s) => s.complete).length,
              total: totalSteps ?? steps.length,
            })}
          </p>
        ) : null}
      </div>
      <ol className="space-y-2" role="list">
        {steps.map((step) => {
          const optional = step.optional === true;

          return (
            <SetupStepRow
              key={step.id}
              stepNumber={STEP_NUMBER[step.id]}
              label={t(`balance.setup.steps.${step.id}.label`)}
              hint={t(getHintKey(step.id, hasAccounts))}
              complete={step.complete}
              optional={
                optional ? t('balance.setup.optional') : undefined
              }
              isNext={nextStepId === step.id}
              actionLabel={t(
                optional
                  ? 'balance.setup.actionOptional'
                  : 'balance.setup.action',
              )}
              to={balancePath(STEP_TAB[step.id])}
              onAction={
                onStepAction
                  ? () => onStepAction(step.id)
                  : onAction
                    ? () => onAction(step.id)
                    : undefined
              }
            />
          );
        })}
      </ol>
    </section>
  );
}
