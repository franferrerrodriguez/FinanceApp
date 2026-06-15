import { useTranslation } from 'react-i18next';
import { FormCheckboxField } from './FormCheckboxField';
import { FormSection } from './FormSection';
import { FormSectionHeader } from './FormSectionHeader';
import { getEffectiveBudgetInvestment } from '../lib/calculations';
import { MoneyInput } from './MoneyInput';
import { ui } from '../lib/uiClasses';

export function PayYourselfFirstBlock({ settings, setSettings }) {
  const { t } = useTranslation();
  const amount = getEffectiveBudgetInvestment(settings);
  const countsForCushion = settings.emergencyFundCountsInvestment ?? true;

  return (
    <FormSection>
      <FormSectionHeader
        title={t('balance.cashflow.investmentsTitle')}
        accent={t('balance.cashflow.investmentsTagline')}
      />

      <div className="flex items-center gap-3">
        <label
          htmlFor="budget-investment"
          className={`flex-1 text-sm font-medium ${ui.textLabel}`}
        >
          {t('balance.cashflow.investmentsAmountInline')}
        </label>
        <MoneyInput
          id="budget-investment"
          value={amount}
          onChange={(v) => setSettings({ monthlyBudgetInvestment: v })}
        />
      </div>

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
