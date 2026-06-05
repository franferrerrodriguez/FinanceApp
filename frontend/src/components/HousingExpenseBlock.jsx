import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useHousingLiability } from '../hooks/useHousingLiability';
import {
  getEffectiveMortgageRent,
  getMortgageRentTotal,
} from '../lib/calculations';
import { BALANCE_TAB, balancePath } from '../lib/balanceTabs';
import {
  getMortgageOutstandingBalance,
  HOUSING_TYPE,
} from '../lib/housingLiability';
import { SharedExpenseBlock } from '../modules/onboarding/components/SharedExpenseBlock';
import { ui } from '../lib/uiClasses';
import { formatMoney } from '../utils/formatters';

export function HousingExpenseBlock({ settings, setSettings, snapshots }) {
  const { t } = useTranslation();
  const { housingType, linkedLiability, setHousingType } = useHousingLiability();

  const outstanding = getMortgageOutstandingBalance(snapshots, linkedLiability);
  const isMortgage = housingType === HOUSING_TYPE.MORTGAGE;

  return (
    <div className={`${ui.block} space-y-4 p-4`}>
      <fieldset>
        <legend className={`mb-2 block text-sm font-medium ${ui.textLabel}`}>
          {t('balance.cashflow.housingTypeLabel')}
        </legend>
        <div className="flex flex-wrap gap-2">
          {[
            { value: HOUSING_TYPE.RENT, label: t('balance.cashflow.housingRent') },
            {
              value: HOUSING_TYPE.MORTGAGE,
              label: t('balance.cashflow.housingMortgage'),
            },
          ].map(({ value, label }) => {
            const selected = housingType === value;
            return (
              <label
                key={value}
                className={`inline-flex cursor-pointer items-center rounded-lg border px-3 py-2 text-sm ${
                  selected
                    ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/40'
                    : ui.cardMuted
                }`}
              >
                <input
                  type="radio"
                  name="housing-type"
                  className="sr-only"
                  checked={selected}
                  onChange={() => setHousingType(value)}
                />
                {label}
              </label>
            );
          })}
        </div>
        <p className={`mt-2 text-xs leading-relaxed ${ui.textMuted}`}>
          {isMortgage
            ? t('balance.cashflow.housingMortgageHint')
            : t('balance.cashflow.housingRentHint')}
        </p>
      </fieldset>

      <SharedExpenseBlock
        id="balance-housing-payment"
        label={
          isMortgage
            ? t('balance.cashflow.housingMortgagePayment')
            : t('balance.cashflow.housingRentPayment')
        }
        hint={
          isMortgage
            ? t('balance.cashflow.housingMortgagePaymentHint')
            : t('balance.cashflow.housingRentPaymentHint')
        }
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

      {isMortgage ? (
        <div
          className={`rounded-xl border px-3 py-3 text-sm ${ui.cardMuted}`}
        >
          <p className={`font-medium ${ui.textLabel}`}>
            {t('balance.cashflow.housingDebtTitle')}
          </p>
          {outstanding != null ? (
            <p className={`mt-1 text-lg font-semibold tabular-nums text-red-600 dark:text-red-400`}>
              {formatMoney(outstanding)}
            </p>
          ) : (
            <p className={`mt-1 ${ui.text}`}>
              {t('balance.cashflow.housingDebtMissing')}
            </p>
          )}
          <p className={`mt-2 text-xs ${ui.textMuted}`}>
            {t('balance.cashflow.housingDebtNote')}
          </p>
          <Link
            to={balancePath(BALANCE_TAB.PATRIMONY)}
            className="mt-2 inline-block text-sm font-semibold text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
          >
            {t('balance.cashflow.housingDebtAction')}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
