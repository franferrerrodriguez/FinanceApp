import { useTranslation } from 'react-i18next';
import {
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

  const mortgage = getEffectiveMortgageRent(settings);
  const household = sumEuros(
    getEffectiveHouseholdExpenses(settings),
    getEffectiveGroceries(settings),
  );
  const leisure = getEffectiveLeisureExpenses(settings);

  return (
    <div className={`overflow-hidden ${ui.block} ${ui.expenseSummary}`}>
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
