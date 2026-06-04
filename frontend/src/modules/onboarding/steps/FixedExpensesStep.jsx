import { useTranslation } from 'react-i18next';
import {
  getEffectiveGroceries,
  getEffectiveHouseholdExpenses,
  getEffectiveLeisureExpenses,
  getEffectiveMortgageRent,
  getGroceriesTotal,
  getHouseholdTotal,
  getLeisureTotal,
  getMortgageRentTotal,
} from '../../../lib/calculations';
import { patchExpenseViewMode } from '../../../lib/expenseViewMode';
import { DetailedHouseholdBreakdown } from '../components/DetailedHouseholdBreakdown';
import { ExpenseViewToggle } from '../components/ExpenseViewToggle';
import { ui } from '../../../lib/uiClasses';
import { useSettings } from '../../../store/hooks';
import { ExpenseSubtotals } from '../components/ExpenseSubtotals';
import { OnboardingActions } from '../components/OnboardingActions';
import { SharedExpenseBlock } from '../components/SharedExpenseBlock';

export function FixedExpensesStep({ onBack, onNext }) {
  const { t } = useTranslation();
  const { settings, setSettings } = useSettings();

  const detailed = settings.useDetailedExpenses ?? false;

  const toggleDetailed = () => {
    setSettings(patchExpenseViewMode(settings, !detailed));
  };

  return (
    <>
      <h2 className={`mb-2 text-2xl font-bold ${ui.heading}`}>
        {t('onboarding.expenses.title')}
      </h2>
      <p className={`mb-6 ${ui.text}`}>{t('onboarding.expenses.subtitle')}</p>

      <div className="space-y-4">
        <SharedExpenseBlock
          id="mortgage-rent"
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

      <OnboardingActions onBack={onBack} onNext={onNext} />
    </>
  );
}
