import { useTranslation } from 'react-i18next';
import { getEffectiveBudgetInvestment } from '../lib/calculations';
import { ui } from '../lib/uiClasses';
import { MoneyField } from '../modules/onboarding/components/MoneyField';

export function PayYourselfFirstBlock({ settings, setSettings }) {
  const { t } = useTranslation();
  const amount = getEffectiveBudgetInvestment(settings);
  const countsForCushion = settings.emergencyFundCountsInvestment ?? false;

  return (
    <div className={`${ui.block} space-y-3 p-4`}>
      <p className={`text-sm font-medium italic ${ui.accentSoft}`}>
        {t('balance.cashflow.investmentsTagline')}
      </p>

      <MoneyField
        id="budget-investment"
        label={t('balance.cashflow.investmentsTitle')}
        hint={t('balance.cashflow.investmentsHint')}
        value={amount}
        onChange={(v) => setSettings({ monthlyBudgetInvestment: v })}
      />

      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={countsForCushion}
          onChange={(e) =>
            setSettings({ emergencyFundCountsInvestment: e.target.checked })
          }
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-400 text-emerald-500 focus:ring-emerald-500/40 dark:border-slate-600 dark:bg-slate-900"
        />
        <span className={`text-sm leading-snug ${ui.textLabel}`}>
          {t('balance.cashflow.investmentsCountForCushion')}
          <span className={`mt-1 block text-xs font-normal ${ui.textMuted}`}>
            {t('balance.cashflow.investmentsCountForCushionHint')}
          </span>
        </span>
      </label>
    </div>
  );
}
