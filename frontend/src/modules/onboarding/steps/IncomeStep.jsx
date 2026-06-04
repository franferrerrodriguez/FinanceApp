import { Trans, useTranslation } from 'react-i18next';
import { calcTotalIncome } from '../../../lib/calculations';
import { ui } from '../../../lib/uiClasses';
import { useSettings } from '../../../store/hooks';
import { LiveTotal } from '../components/LiveTotal';
import { SalaryFields } from '../../../components/SalaryFields';
import { MoneyField } from '../components/MoneyField';
import { OnboardingActions } from '../components/OnboardingActions';

export function IncomeStep({ onBack, onNext }) {
  const { t } = useTranslation();
  const { settings, setSettings } = useSettings();

  const total = calcTotalIncome(settings);
  const canContinue = total > 0;

  return (
    <>
      <h2 className={`mb-2 text-2xl font-bold ${ui.heading}`}>
        {t('onboarding.income.title')}
      </h2>
      <p className={`mb-6 ${ui.text}`}>
        <Trans
          i18nKey="onboarding.income.intro"
          components={{
            strong: <strong className={ui.textLabel} />,
          }}
        />
      </p>

      <div className="space-y-5">
        <SalaryFields
          settings={settings}
          setSettings={setSettings}
          idPrefix="onboarding"
        />
        <MoneyField
          id="other-monthly-income"
          label={t('onboarding.income.otherIncome')}
          hint={t('onboarding.income.otherIncomeHint')}
          value={settings.otherMonthlyIncome}
          onChange={(v) => setSettings({ otherMonthlyIncome: v })}
        />
        <LiveTotal
          label={t('onboarding.income.totalIncome')}
          amount={total}
          variant="positive"
        />
      </div>

      <OnboardingActions
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!canContinue}
      />
    </>
  );
}
