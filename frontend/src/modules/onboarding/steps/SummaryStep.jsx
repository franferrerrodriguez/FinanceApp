import { useTranslation } from 'react-i18next';
import { useAuthModal } from '../../../context/AuthModalContext';
import {
  calcFreeCashflow,
  calcSavingsRate,
  calcTotalFixedExpenses,
  calcTotalIncome,
  calcTotalVariableExpenses,
  getEffectiveBudgetInvestment,
  getEffectiveGroceries,
  getEffectiveHouseholdExpenses,
  getEffectiveLeisureExpenses,
  getEffectiveMortgageRent,
} from '../../../lib/calculations';
import { sumEuros } from '../../../lib/money';
import { DEFAULT_SETTINGS } from '../../../lib/constants';
import { ui } from '../../../lib/uiClasses';
import { useProfile, useSettings } from '../../../store/hooks';
import { formatMoney, formatPercent } from '../../../utils/formatters';
import { OnboardingActions } from '../components/OnboardingActions';

export function SummaryStep({ onBack, onFinish }) {
  const { t } = useTranslation();
  const { openRegister } = useAuthModal();
  const { settings } = useSettings();
  const { profile } = useProfile();
  const income = calcTotalIncome(settings);
  const fixed = calcTotalFixedExpenses(settings);
  const leisure = calcTotalVariableExpenses(settings);
  const mortgage = getEffectiveMortgageRent(settings);
  const household = sumEuros(
    getEffectiveHouseholdExpenses(settings),
    getEffectiveGroceries(settings),
  );
  const investment = getEffectiveBudgetInvestment(settings);
  const cashflow = calcFreeCashflow(income, fixed, investment, leisure);
  const savingsRate = calcSavingsRate(income, fixed, leisure + investment);
  const savingsColor = getSavingsColor(savingsRate);

  return (
    <>
      <h2 className={`mb-2 ${ui.pageTitle}`}>
        {profile?.name
          ? t('onboarding.summary.titleWithName', { name: profile.name })
          : t('onboarding.summary.title')}
      </h2>
      <p className={`mb-6 ${ui.text}`}>{t('onboarding.summary.subtitle')}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryCard label={t('onboarding.summary.income')} value={formatMoney(income)} />
        <SummaryCard
          label={t('onboarding.expenses.subtotalMortgage')}
          value={formatMoney(mortgage)}
        />
        <SummaryCard
          label={t('onboarding.expenses.subtotalHousehold')}
          value={formatMoney(household)}
        />
        <SummaryCard
          label={t('onboarding.expenses.subtotalLeisure')}
          value={formatMoney(leisure)}
        />
        <SummaryCard
          label={t('onboarding.summary.freeCashflow')}
          value={formatMoney(cashflow)}
          highlight={cashflow < 0}
        />
        <SummaryCard
          label={t('onboarding.summary.savingsRate')}
          value={formatPercent(savingsRate)}
          colorClass={savingsColor}
          className="sm:col-span-2"
        />
      </div>

      <p className={`mt-6 text-sm leading-relaxed ${ui.textMuted}`}>
        {t('onboarding.summary.hint')}
      </p>

      <div className={`mt-6 rounded-xl border p-4 ${ui.cardInset}`}>
        <p className={`text-sm font-medium ${ui.textLabel}`}>
          {t('onboarding.summary.registerPrompt')}
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            className={`flex-1 ${ui.btnPrimary}`}
            onClick={openRegister}
          >
            {t('onboarding.summary.registerCta')}
          </button>
          <button
            type="button"
            className={`flex-1 ${ui.btnSecondary}`}
            onClick={onFinish}
          >
            {t('onboarding.summary.registerLater')}
          </button>
        </div>
      </div>

      <OnboardingActions
        onBack={onBack}
        onNext={onFinish}
        nextLabel={t('common.start')}
      />
    </>
  );
}

function SummaryCard({ label, value, highlight, colorClass, className = '' }) {
  const valueStyle = highlight
    ? 'text-red-600 dark:text-red-400'
    : colorClass ?? ui.heading;

  return (
    <div className={`p-4 ${ui.card} ${className}`.trim()}>
      <p className={`text-xs ${ui.textMuted}`}>{label}</p>
      <p className={`mt-1 text-xl font-bold ${valueStyle}`}>{value}</p>
    </div>
  );
}

function getSavingsColor(rate) {
  if (rate >= DEFAULT_SETTINGS.SAVINGS_RATE_GREEN) return 'text-emerald-600 dark:text-emerald-400';
  if (rate >= DEFAULT_SETTINGS.SAVINGS_RATE_YELLOW) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}
