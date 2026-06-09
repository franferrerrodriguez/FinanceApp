import { useTranslation } from 'react-i18next';
import { FormCheckboxField } from './FormCheckboxField';
import { FormSection } from './FormSection';
import { getEffectiveBudgetInvestment } from '../lib/calculations';
import { ui } from '../lib/uiClasses';
import { MoneyField } from './MoneyField';

export function PayYourselfFirstBlock({ settings, setSettings }) {
  const { t } = useTranslation();
  const amount = getEffectiveBudgetInvestment(settings);
  const countsForCushion = settings.emergencyFundCountsInvestment ?? true;

  return (
    <FormSection>
      <div>
        <p className={`text-sm font-medium ${ui.textLabel}`}>
          {t('balance.cashflow.investmentsTitle')}
        </p>
        <p className={`mt-0.5 text-sm italic ${ui.accentSoft}`}>
          {t('balance.cashflow.investmentsTagline')}
        </p>
      </div>

      <MoneyField
        id="budget-investment"
        label={t('balance.cashflow.investmentsAmount')}
        hint={t('balance.cashflow.investmentsHint')}
        value={amount}
        onChange={(v) => setSettings({ monthlyBudgetInvestment: v })}
        fullWidth
      />

      <FormCheckboxField
        id="budget-investment-cushion"
        checked={countsForCushion}
        onChange={(v) => setSettings({ emergencyFundCountsInvestment: v })}
        label={t('balance.cashflow.investmentsCountForCushion')}
        hint={t('balance.cashflow.investmentsCountForCushionHint')}
      />
    </FormSection>
  );
}
