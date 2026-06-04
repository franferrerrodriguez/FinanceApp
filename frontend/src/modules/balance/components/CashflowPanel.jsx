import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PercentRow } from '../../../components/PercentRow';
import {
  calcTotalFixedExpenses,
  calcTotalIncome,
  calcTotalVariableExpenses,
  getEffectiveGroceries,
  getEffectiveHouseholdExpenses,
  getEffectiveLeisureExpenses,
  getEffectiveMortgageRent,
  getGroceriesTotal,
  getHouseholdTotal,
  getLeisureTotal,
  getMortgageRentTotal,
} from '../../../lib/calculations';
import { allocateEurosByWeights } from '../../../lib/money';
import { ui } from '../../../lib/uiClasses';
import { useFinanceData } from '../../../store/hooks';
import { formatMoney, formatPercent } from '../../../utils/formatters';
import { AnnualExpensesSection } from '../../../components/AnnualExpensesSection';
import { EmergencyFundSection } from '../../../components/EmergencyFundSection';
import { SalaryFields } from '../../../components/SalaryFields';
import { SalaryHistorySection } from '../../../components/SalaryHistorySection';
import { MoneyField } from '../../onboarding/components/MoneyField';
import { ExpenseSubtotals } from '../../onboarding/components/ExpenseSubtotals';
import { SharedExpenseBlock } from '../../onboarding/components/SharedExpenseBlock';

export function CashflowPanel() {
  const { t } = useTranslation();
  const {
    settings,
    setSettings,
    annualExpenses,
    salaryHistory,
    addAnnualExpense,
    updateAnnualExpense,
    removeAnnualExpense,
    addSalaryHistoryEntry,
    updateSalaryHistoryEntry,
    removeSalaryHistoryEntry,
  } = useFinanceData();

  const income = calcTotalIncome(settings);
  const fixed = calcTotalFixedExpenses(settings);
  const leisure = calcTotalVariableExpenses(settings);
  const savingsFromSalary = income - fixed - leisure;
  const savingsRate = income > 0 ? Math.max(0, savingsFromSalary / income) : 0;
  const detailed = settings.useDetailedExpenses ?? false;

  const toggleDetailed = () => {
    const next = !detailed;
    if (next && (settings.householdFixedEstimate ?? 0) > 0) {
      const total = settings.householdFixedEstimate;
      const [utilities, insurance, subscriptions, otherFixedExpenses] =
        allocateEurosByWeights(total, [40, 35, 15, 10]);
      setSettings({
        useDetailedExpenses: true,
        utilities,
        insurance,
        subscriptions,
        otherFixedExpenses,
      });
    } else {
      setSettings({ useDetailedExpenses: next });
    }
  };

  return (
    <div className="space-y-6">
      <div className={`${ui.chartCard} grid gap-3 sm:grid-cols-2 lg:grid-cols-4`}>
        <Stat label={t('balance.cashflow.income')} value={formatMoney(income)} />
        <Stat label={t('balance.cashflow.fixed')} value={formatMoney(fixed)} />
        <Stat label={t('balance.cashflow.leisure')} value={formatMoney(leisure)} />
        <Stat
          label={t('balance.cashflow.savings')}
          value={formatMoney(savingsFromSalary)}
          sub={formatPercent(savingsRate)}
        />
      </div>

      <section className={`${ui.chartCard} space-y-5`}>
        <div>
          <h3 className={`text-base font-semibold ${ui.heading}`}>
            {t('balance.cashflow.incomeTitle')}
          </h3>
          <p className={`mt-1 text-sm ${ui.textMuted}`}>
            {t('balance.cashflow.incomeSubtitle')}
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <SalaryFields
            settings={settings}
            setSettings={setSettings}
            idPrefix="balance"
          />
          <MoneyField
            id="balance-other-income"
            label={t('onboarding.income.otherIncome')}
            hint={t('onboarding.income.otherIncomeHint')}
            value={settings.otherMonthlyIncome}
            onChange={(v) => setSettings({ otherMonthlyIncome: v })}
          />
        </div>
        <SalaryHistorySection
          items={salaryHistory}
          onAdd={addSalaryHistoryEntry}
          onUpdate={updateSalaryHistoryEntry}
          onRemove={removeSalaryHistoryEntry}
        />
      </section>

      <section className={`${ui.chartCard} space-y-4`}>
        <div>
          <h3 className={`text-base font-semibold ${ui.heading}`}>
            {t('balance.cashflow.expensesTitle')}
          </h3>
          <p className={`mt-1 text-sm ${ui.textMuted}`}>
            {t('balance.cashflow.expensesSubtitle')}
          </p>
        </div>

        <SharedExpenseBlock
          id="balance-mortgage"
          label={t('onboarding.expenses.mortgageRentTotal')}
          hint={t('onboarding.expenses.mortgageRentTotalHint')}
          total={getMortgageRentTotal(settings)}
          yourShare={getEffectiveMortgageRent(settings)}
          shared={settings.mortgageRentShared ?? false}
          percent={settings.mortgageRentYourSharePercent ?? 50}
          onTotalChange={(v) =>
            setSettings({ mortgageRentTotal: v, mortgageRent: v })
          }
          onSharedChange={(v) => setSettings({ mortgageRentShared: v })}
          onPercentChange={(v) =>
            setSettings({ mortgageRentYourSharePercent: v })
          }
        />

        {!detailed && (
          <SharedExpenseBlock
            id="balance-household"
            label={t('onboarding.expenses.household')}
            hint={t('onboarding.expenses.householdHint')}
            total={getHouseholdTotal(settings)}
            yourShare={getEffectiveHouseholdExpenses(settings)}
            shared={settings.householdFixedShared ?? false}
            percent={settings.householdFixedYourSharePercent ?? 50}
            onTotalChange={(v) =>
              setSettings({
                householdFixedEstimate: v,
                householdFixedIsEstimate: true,
              })
            }
            onSharedChange={(v) => setSettings({ householdFixedShared: v })}
            onPercentChange={(v) =>
              setSettings({ householdFixedYourSharePercent: v })
            }
          />
        )}

        <SharedExpenseBlock
          id="balance-groceries"
          label={t('onboarding.expenses.groceries')}
          hint={t('onboarding.expenses.groceriesHint')}
          total={getGroceriesTotal(settings)}
          yourShare={getEffectiveGroceries(settings)}
          shared={settings.groceriesShared ?? false}
          percent={settings.groceriesYourSharePercent ?? 50}
          onTotalChange={(v) =>
            setSettings({ groceriesEstimate: v, groceriesIsEstimate: true })
          }
          onSharedChange={(v) => setSettings({ groceriesShared: v })}
          onPercentChange={(v) =>
            setSettings({ groceriesYourSharePercent: v })
          }
        />

        <SharedExpenseBlock
          id="balance-leisure"
          label={t('onboarding.expenses.leisure')}
          hint={t('onboarding.expenses.leisureHint')}
          total={getLeisureTotal(settings)}
          yourShare={getEffectiveLeisureExpenses(settings)}
          shared={settings.leisureShared ?? false}
          percent={settings.leisureYourSharePercent ?? 50}
          onTotalChange={(v) =>
            setSettings({ leisureEstimate: v, leisureIsEstimate: true })
          }
          onSharedChange={(v) => setSettings({ leisureShared: v })}
          onPercentChange={(v) => setSettings({ leisureYourSharePercent: v })}
        />

        <button
          type="button"
          onClick={toggleDetailed}
          className={`text-sm font-medium ${ui.accentSoft} hover:underline`}
        >
          {detailed
            ? t('onboarding.expenses.useSimpleView')
            : t('onboarding.expenses.useDetailedView')}
        </button>

        {detailed ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <MoneyField
              id="balance-utilities"
              label={t('onboarding.expenses.utilities')}
              value={settings.utilities}
              onChange={(v) => setSettings({ utilities: v })}
            />
            <MoneyField
              id="balance-insurance"
              label={t('onboarding.expenses.insurance')}
              value={settings.insurance}
              onChange={(v) => setSettings({ insurance: v })}
            />
            <MoneyField
              id="balance-subscriptions"
              label={t('onboarding.expenses.subscriptions')}
              value={settings.subscriptions}
              onChange={(v) => setSettings({ subscriptions: v })}
            />
            <MoneyField
              id="balance-other-fixed"
              label={t('onboarding.expenses.otherFixed')}
              value={settings.otherFixedExpenses}
              onChange={(v) => setSettings({ otherFixedExpenses: v })}
            />
          </div>
        ) : null}

        <div className={`rounded-xl ${ui.cardInset}`}>
          <ExpenseSubtotals settings={settings} />
        </div>

        <AnnualExpensesSection
          items={annualExpenses}
          onAdd={addAnnualExpense}
          onUpdate={updateAnnualExpense}
          onRemove={removeAnnualExpense}
        />
      </section>

      <EmergencyFundSection
        settings={settings}
        setSettings={setSettings}
        annualExpenses={annualExpenses}
      />

      <section className={`${ui.chartCard} space-y-4`}>
        <div>
          <h3 className={`text-base font-semibold ${ui.heading}`}>
            {t('balance.cashflow.projectionGrowthTitle')}
          </h3>
          <p className={`mt-1 text-sm ${ui.textMuted}`}>
            {t('balance.cashflow.projectionGrowthSubtitle')}
          </p>
        </div>
        <div className={`divide-y ${ui.divider}`}>
          <PercentRow
            label={t('balance.cashflow.expenseIncrease')}
            hint={t('balance.cashflow.expenseIncreaseHint')}
            value={settings.projectionAnnualExpenseIncrease}
            onChange={(v) =>
              setSettings({ projectionAnnualExpenseIncrease: v })
            }
          />
        </div>
        <label className="block">
          <span className={`mb-1.5 block text-sm font-medium ${ui.textLabel}`}>
            {t('balance.cashflow.initialPatrimony')}
          </span>
          <input
            type="number"
            min={0}
            step="100"
            value={settings.initialPatrimony ?? 0}
            onChange={(e) =>
              setSettings({
                initialPatrimony: Math.max(0, parseFloat(e.target.value) || 0),
              })
            }
            className={`${ui.input} ${ui.inputCompact} max-w-xs`}
          />
        </label>
      </section>

      <p className={`text-sm ${ui.textMuted}`}>
        {t('balance.cashflow.usedBy')}{' '}
        <Link
          to="/proyeccion"
          className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
        >
          {t('nav.projection')}
        </Link>
        {' · '}
        <Link
          to="/dashboard"
          className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
        >
          {t('nav.dashboard')}
        </Link>
      </p>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${ui.cardMuted}`}>
      <p className={`text-xs ${ui.textMuted}`}>{label}</p>
      <p className={`mt-0.5 text-lg font-bold tabular-nums ${ui.heading}`}>
        {value}
      </p>
      {sub ? <p className={`text-xs ${ui.textMuted}`}>{sub}</p> : null}
    </div>
  );
}
