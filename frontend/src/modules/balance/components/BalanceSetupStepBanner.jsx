import { useTranslation } from 'react-i18next';
import {
  BALANCE_SETUP_STEP,
  needsAccountBalancesSetup,
  needsAddAssetsSetup,
  needsLiquidAccountsSetup,
} from '../../../lib/balanceSetupProgress';
import { hasPatrimonyAccounts } from '../../../lib/monthlyClose';
import { ui } from '../../../lib/uiClasses';
import { useFinanceData } from '../../../store/hooks';

export function BalanceSetupStepBanner({ stepId, onAction }) {
  const { t } = useTranslation();
  const { assets, liabilities, snapshots } = useFinanceData();

  const show =
    stepId === BALANCE_SETUP_STEP.ADD_ASSETS
      ? needsAddAssetsSetup(assets)
      : stepId === BALANCE_SETUP_STEP.ACCOUNTS
        ? needsAccountBalancesSetup(assets, liabilities, snapshots)
        : stepId === BALANCE_SETUP_STEP.LIQUID
          ? needsLiquidAccountsSetup(assets, liabilities, snapshots)
          : false;

  if (!show) return null;

  const optional = false;
  const hasAccounts = hasPatrimonyAccounts(assets, liabilities);
  const hintKey =
    stepId === BALANCE_SETUP_STEP.ACCOUNTS && hasAccounts
      ? 'balance.setup.steps.accounts.hintBalances'
      : `balance.setup.steps.${stepId}.hint`;
  const actionLabel = t(
    optional ? 'balance.setup.actionOptional' : 'balance.setup.action',
  );
  const actionClass = `shrink-0 text-sm ${
    optional ? ui.btnSecondary : ui.btnPrimary
  }`;

  return (
    <section
      className={`rounded-xl border px-4 py-3 ${
        optional
          ? ui.cardMuted
          : '[border:0.5px_solid_rgba(29,158,117,0.40)] bg-[rgba(29,158,117,0.08)]'
      }`}
      aria-label={t(`balance.setup.steps.${stepId}.label`)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={`text-sm font-medium ${ui.textLabel}`}>
              {t(`balance.setup.steps.${stepId}.label`)}
            </p>
            {optional ? (
              <span
                className={`rounded-full [border:0.5px_solid_rgba(255,255,255,0.12)] px-2 py-0.5 text-xs font-medium ${ui.textMuted}`}
              >
                {t('balance.setup.optional')}
              </span>
            ) : null}
          </div>
          <p className={`mt-0.5 text-sm ${ui.textMuted}`}>{t(hintKey)}</p>
        </div>
        {onAction ? (
          <button type="button" className={actionClass} onClick={onAction}>
            {actionLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}
