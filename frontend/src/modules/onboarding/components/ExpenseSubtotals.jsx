import { useTranslation } from 'react-i18next';
import {
  getEffectiveGroceries,
  getEffectiveHouseholdExpenses,
  getEffectiveLeisureExpenses,
  getEffectiveMortgageRent,
} from '../../../lib/calculations';
import { sumEuros } from '../../../lib/money';
import { LiveTotal } from './LiveTotal';

/** Resumen de gastos mensuales (tu parte efectiva por bloque). */
export function ExpenseSubtotals({ settings }) {
  const { t } = useTranslation();

  const mortgage = getEffectiveMortgageRent(settings);
  const household = sumEuros(
    getEffectiveHouseholdExpenses(settings),
    getEffectiveGroceries(settings),
  );
  const leisure = getEffectiveLeisureExpenses(settings);

  return (
    <div className="space-y-2">
      <LiveTotal
        label={t('onboarding.expenses.subtotalMortgage')}
        amount={mortgage}
      />
      <LiveTotal
        label={t('onboarding.expenses.subtotalHousehold')}
        amount={household}
      />
      <LiveTotal
        label={t('onboarding.expenses.subtotalLeisure')}
        amount={leisure}
      />
    </div>
  );
}
