import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { calcMonthlyExpenseBaseline } from '../lib/emergencyFund';
import { ui } from '../lib/uiClasses';
import { formatMoney } from '../utils/formatters';

const MONTH_OPTIONS = [3, 6, 12];

export function EmergencyFundSection({ settings, setSettings, annualExpenses }) {
  const { t } = useTranslation();
  const months = settings.emergencyFundMonths ?? 6;

  const monthlyExpenses = useMemo(
    () => calcMonthlyExpenseBaseline(settings, annualExpenses),
    [settings, annualExpenses],
  );

  const target = monthlyExpenses * months;

  return (
    <section className={`${ui.chartCard} space-y-4`}>
      <div>
        <h3 className={`text-base font-semibold ${ui.heading}`}>
          {t('balance.cashflow.emergencyFundTitle')}
        </h3>
        <p className={`mt-1 text-sm ${ui.textMuted}`}>
          {t('balance.cashflow.emergencyFundSubtitle')}
        </p>
      </div>

      <fieldset>
        <legend className={`mb-2 block text-sm font-medium ${ui.textLabel}`}>
          {t('balance.cashflow.emergencyFundMonthsLabel')}
        </legend>
        <div className="flex flex-wrap gap-2">
          {MONTH_OPTIONS.map((value) => (
            <label
              key={value}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                months === value
                  ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/40'
                  : ui.cardMuted
              }`}
            >
              <input
                type="radio"
                name="emergency-fund-months"
                className="sr-only"
                checked={months === value}
                onChange={() => setSettings({ emergencyFundMonths: value })}
              />
              {t('balance.cashflow.emergencyFundMonthsOption', { count: value })}
            </label>
          ))}
        </div>
      </fieldset>

      <p className={`text-xs ${ui.textMuted}`}>
        {t('balance.cashflow.emergencyFundTargetHint', {
          target: formatMoney(target),
          months,
          monthly: formatMoney(monthlyExpenses),
        })}
      </p>
    </section>
  );
}
