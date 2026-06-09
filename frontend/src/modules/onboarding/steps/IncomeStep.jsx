import { Trans, useTranslation } from 'react-i18next';
import { calcTotalIncome } from '../../../lib/calculations';
import { ui } from '../../../lib/uiClasses';
import { useSettings } from '../../../store/hooks';
import { SalaryFields } from '../../../components/SalaryFields';
import { LiveTotal } from '../components/LiveTotal';
import { MoneyField } from '../components/MoneyField';
import { OnboardingActions } from '../components/OnboardingActions';
import { OnboardingStepHeader } from '../components/OnboardingStepHeader';

export function IncomeStep({ onBack, onNext }) {
  const { t } = useTranslation();
  const { settings, setSettings } = useSettings();

  const total = calcTotalIncome(settings);

  return (
    <>
      <OnboardingStepHeader title={t('onboarding.income.title')} />
      <p className={`mb-6 ${ui.text}`}>
        <Trans
          i18nKey="onboarding.income.intro"
          components={{
            strong: <strong className={ui.textLabel} />,
          }}
        />
      </p>

      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2 sm:items-start">
          <MoneyField
            id="onboarding-monthly-salary"
            label={t('balance.cashflow.salaryNormalLabel')}
            hint={t('balance.cashflow.salaryNormalHint')}
            value={settings.monthlyNetSalary}
            onChange={(v) => setSettings({ monthlyNetSalary: v })}
            fullWidth
            layout="grid"
          />
          <MoneyField
            id="other-monthly-income"
            label={t('onboarding.income.otherIncome')}
            hint={t('onboarding.income.otherIncomeHint')}
            value={settings.otherMonthlyIncome}
            onChange={(v) => setSettings({ otherMonthlyIncome: v })}
            fullWidth
            layout="grid"
          />
        </div>
        <SalaryFields
          settings={settings}
          setSettings={setSettings}
          idPrefix="onboarding"
          includeSalaryInput={false}
        />
        <LiveTotal
          label={t('onboarding.income.totalIncome')}
          amount={total}
          variant="positive"
        />
      </div>

      <OnboardingActions onBack={onBack} onNext={onNext} />
    </>
  );
}
