import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useHousingLiability } from '../hooks/useHousingLiability';
import {
  getEffectiveMortgageRent,
  getMortgageRentTotal,
} from '../lib/calculations';
import { BALANCE_TAB, balancePath } from '../lib/balanceTabs';
import { getMortgageOutstandingBalance } from '../lib/housingLiability';
import { FormSection } from './FormSection';
import { SharedExpenseBlock } from '../modules/onboarding/components/SharedExpenseBlock';
import { ui } from '../lib/uiClasses';
import { formatMoney } from '../utils/formatters';

export function HousingExpenseBlock({
  settings,
  setSettings,
  snapshots,
  inOnboarding = false,
}) {
  const { t } = useTranslation();
  const {
    linkedLiability,
    tracksMortgageCapital,
    enableMortgageTracking,
    disableMortgageTracking,
  } = useHousingLiability();

  const outstanding = getMortgageOutstandingBalance(snapshots, linkedLiability);

  return (
    <FormSection className="space-y-4">
      <SharedExpenseBlock
        embedded
        id="balance-housing-payment"
        label={t('balance.cashflow.housingPayment')}
        hint={t('balance.cashflow.housingPaymentHint')}
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

      {!inOnboarding && tracksMortgageCapital ? (
        <div className={`rounded-xl border px-3 py-3 text-sm ${ui.cardMuted}`}>
          <p className={`font-medium ${ui.textLabel}`}>
            {t('balance.cashflow.housingDebtTitle')}
          </p>
          {outstanding != null ? (
            <p className="mt-1 text-lg font-semibold tabular-nums text-red-600 dark:text-red-400">
              {formatMoney(outstanding)}
            </p>
          ) : (
            <p className={`mt-1 text-sm ${ui.textMuted}`}>
              {t('balance.cashflow.housingDebtMissing')}
            </p>
          )}
          <Link
            to={balancePath(BALANCE_TAB.PATRIMONY)}
            className="mt-2 inline-block text-sm font-semibold text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
          >
            {t('balance.cashflow.housingDebtAction')}
          </Link>
          <button
            type="button"
            className={`mt-3 block text-xs underline-offset-2 hover:underline ${ui.textMuted}`}
            onClick={disableMortgageTracking}
          >
            {t('balance.cashflow.housingDisableTracking')}
          </button>
        </div>
      ) : !inOnboarding ? (
        <button
          type="button"
          className="text-left text-sm font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
          onClick={enableMortgageTracking}
        >
          {t('balance.cashflow.housingEnableTracking')}
        </button>
      ) : null}
    </FormSection>
  );
}
