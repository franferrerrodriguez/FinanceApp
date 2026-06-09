import { useTranslation } from 'react-i18next';
import {
  getEffectiveBudgetInvestment,
  getEffectiveGroceries,
  getEffectiveHouseholdExpenses,
  getEffectiveLeisureExpenses,
  getEffectiveMortgageRent,
} from '../../../lib/calculations';
import { sumEuros } from '../../../lib/money';
import { ui } from '../../../lib/uiClasses';
import { LiveTotal } from './LiveTotal';

/** Monthly expense summary (your effective share per block). */
export function ExpenseSubtotals({ settings }) {
  const { t } = useTranslation();

  const investment = getEffectiveBudgetInvestment(settings);
  const mortgage = getEffectiveMortgageRent(settings);
  const household = sumEuros(
    getEffectiveHouseholdExpenses(settings),
    getEffectiveGroceries(settings),
  );
  const leisure = getEffectiveLeisureExpenses(settings);

  return (
    <div className={`overflow-hidden ${ui.block} ${ui.expenseSummary}`}>
      {investment > 0 ? (
        <LiveTotal
          inList
          label={t('onboarding.expenses.subtotalInvestments')}
          amount={investment}
        />
      ) : null}
      <LiveTotal
        inList
        label={t('onboarding.expenses.subtotalMortgage')}
        amount={mortgage}
      />
      <LiveTotal
        inList
        label={t('onboarding.expenses.subtotalHousehold')}
        amount={household}
      />
      <LiveTotal
        inList
        label={t('onboarding.expenses.subtotalLeisure')}
        amount={leisure}
      />
    </div>
  );
}
