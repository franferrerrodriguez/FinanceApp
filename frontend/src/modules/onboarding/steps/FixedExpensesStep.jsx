import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getEffectiveGroceries,
  getEffectiveHouseholdExpenses,
  getEffectiveLeisureExpenses,
  getGroceriesTotal,
  getHouseholdTotal,
  getLeisureTotal,
} from '../../../lib/calculations';
import { patchExpenseViewMode } from '../../../lib/expenseViewMode';
import { getMortgageFullOutstandingBalance } from '../../../lib/housingLiability';
import { getCurrentMonthKey } from '../../../lib/dashboardMetrics';
import { useHousingLiability } from '../../../hooks/useHousingLiability';
import { DetailedHouseholdBreakdown } from '../components/DetailedHouseholdBreakdown';
import { ExpenseViewToggle } from '../components/ExpenseViewToggle';
import { ui } from '../../../lib/uiClasses';
import { useFinanceData, useSettings } from '../../../store/hooks';
import { ExpenseSubtotals } from '../components/ExpenseSubtotals';
import { OnboardingActions } from '../components/OnboardingActions';
import { OnboardingStepHeader } from '../components/OnboardingStepHeader';
import { HousingExpenseBlock } from '../../../components/HousingExpenseBlock';
import { PayYourselfFirstBlock } from '../../../components/PayYourselfFirstBlock';
import { OnboardingLiabilitiesSection } from '../components/OnboardingLiabilitiesSection';
import { SharedExpenseBlock } from '../components/SharedExpenseBlock';

export function FixedExpensesStep({ onBack, onNext }) {
  const { t } = useTranslation();
  const { settings, setSettings } = useSettings();
  const { snapshots } = useFinanceData();
  const { linkedLiability, tracksMortgageCapital } = useHousingLiability();

  const monthKey = getCurrentMonthKey();
  const mortgageOutstanding = tracksMortgageCapital
    ? (getMortgageFullOutstandingBalance(settings, snapshots, linkedLiability, monthKey) ?? 0)
    : null;
  const mortgageCapitalMissing = tracksMortgageCapital && !(mortgageOutstanding > 0);

  const [showErrors, setShowErrors] = useState(false);

  const handleNext = () => {
    if (mortgageCapitalMissing) { setShowErrors(true); return; }
    onNext();
  };

  const detailed = settings.useDetailedExpenses ?? false;

  const toggleDetailed = () => {
    setSettings(patchExpenseViewMode(settings, !detailed));
  };

  return (
    <>
      <OnboardingStepHeader
        title={t('onboarding.expenses.title')}
        subtitle={t('onboarding.expenses.subtitle')}
      />

      <div className="space-y-4">
        <PayYourselfFirstBlock settings={settings} setSettings={setSettings} />

        <HousingExpenseBlock
          settings={settings}
          setSettings={setSettings}
          snapshots={snapshots}
          inOnboarding
          showCapitalError={showErrors && mortgageCapitalMissing}
        />

        <OnboardingLiabilitiesSection />

        {!detailed && (
          <SharedExpenseBlock
            id="household"
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
          id="groceries"
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
          id="leisure"
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

        <ExpenseViewToggle detailed={detailed} onToggle={toggleDetailed} />

        {detailed ? (
          <>
            <DetailedHouseholdBreakdown
              settings={settings}
              setSettings={setSettings}
            />
            <SharedExpenseBlock
              shareOnly
              id="household-split"
              label={t('onboarding.expenses.household')}
              total={getHouseholdTotal(settings)}
              yourShare={getEffectiveHouseholdExpenses(settings)}
              shared={settings.householdFixedShared ?? false}
              percent={settings.householdFixedYourSharePercent ?? 50}
              onTotalChange={() => {}}
              onSharedChange={(v) => setSettings({ householdFixedShared: v })}
              onPercentChange={(v) =>
                setSettings({ householdFixedYourSharePercent: v })
              }
            />
          </>
        ) : null}

        <div className={`p-3 ${ui.card}`}>
          <ExpenseSubtotals settings={settings} />
        </div>
      </div>

      <OnboardingActions onBack={onBack} onNext={handleNext} />
    </>
  );
}
