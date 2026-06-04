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
import { allocateEurosByWeights } from '../../../lib/money';
import { ui } from '../../../lib/uiClasses';
import { useSettings } from '../../../store/hooks';
import { ExpenseSubtotals } from '../components/ExpenseSubtotals';
import { MoneyField } from '../components/MoneyField';
import { OnboardingActions } from '../components/OnboardingActions';
import { SharedExpenseBlock } from '../components/SharedExpenseBlock';

export function FixedExpensesStep({ onBack, onNext }) {
  const { t } = useTranslation();
  const { settings, setSettings } = useSettings();

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
        householdFixedIsEstimate: false,
      });
    } else {
      setSettings({ useDetailedExpenses: next });
    }
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

        <button
          type="button"
          onClick={toggleDetailed}
          className={`text-sm underline-offset-2 hover:underline ${ui.accentSoft}`}
        >
          {detailed
            ? t('onboarding.expenses.useSimpleView')
            : t('onboarding.expenses.useDetailedView')}
        </button>

        {detailed && (
          <div className={`space-y-4 p-4 ${ui.cardDashed}`}>
            <p className={`text-xs ${ui.textMuted}`}>
              {t('onboarding.expenses.detailedIntro')}
            </p>
            <MoneyField
              id="utilities"
              label={t('onboarding.expenses.utilities')}
              value={settings.utilities}
              onChange={(v) => setSettings({ utilities: v })}
            />
            <MoneyField
              id="insurance"
              label={t('onboarding.expenses.insurance')}
              value={settings.insurance}
              onChange={(v) => setSettings({ insurance: v })}
            />
            <MoneyField
              id="subscriptions"
              label={t('onboarding.expenses.subscriptions')}
              value={settings.subscriptions}
              onChange={(v) => setSettings({ subscriptions: v })}
            />
            <MoneyField
              id="other-fixed"
              label={t('onboarding.expenses.otherFixed')}
              value={settings.otherFixedExpenses}
              onChange={(v) => setSettings({ otherFixedExpenses: v })}
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
          </div>
        )}

        <div className={`p-4 ${ui.card}`}>
          <ExpenseSubtotals settings={settings} />
        </div>
      </div>

      <OnboardingActions onBack={onBack} onNext={onNext} />
    </>
  );
}
