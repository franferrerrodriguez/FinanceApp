import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useHousingLiability } from '../hooks/useHousingLiability';
import {
  getEffectiveMortgageRent,
  getMortgageRentTotal,
} from '../lib/calculations';
import { BALANCE_TAB, balancePath } from '../lib/balanceTabs';
import { getCurrentMonthKey } from '../lib/dashboardMetrics';
import {
  getMortgageBalanceShareInfo,
  getMortgageBalanceShareInfoFromTotal,
  getMortgageFullOutstandingBalance,
  getMortgageYourShareOutstandingBalance,
  HOUSING_TYPE,
  inferHousingType,
  isMortgageCapitalShared,
  mortgageOutstandingShareToTotal,
  mortgageEnteredOutstandingTotal,
  mortgageOutstandingTotalToShare,
} from '../lib/housingLiability';
import { getLiabilityOutstandingFromSnapshots } from '../lib/liabilitySnapshots';
import { FormFieldFrame } from './FormFieldFrame';
import { FormSection } from './FormSection';
import { MoneyField } from './MoneyField';
import { SharedExpenseBlock } from '../modules/onboarding/components/SharedExpenseBlock';
import { ui } from '../lib/uiClasses';
import { useFinanceData } from '../store/hooks';
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
  const { liabilities, setLiabilityOutstandingBalance, updateLiability } =
    useFinanceData();

  const housingType = inferHousingType(settings, liabilities);
  const monthKey = getCurrentMonthKey();

  const yourShare = getMortgageYourShareOutstandingBalance(
    snapshots,
    linkedLiability,
    monthKey,
  );
  const fullTotal = getMortgageFullOutstandingBalance(
    settings,
    snapshots,
    linkedLiability,
    monthKey,
  );
  const balanceShare = getMortgageBalanceShareInfo(
    settings,
    linkedLiability,
    yourShare,
  );

  const outstandingTotal = useMemo(() => {
    if (!linkedLiability) return 0;
    const share = getLiabilityOutstandingFromSnapshots(
      snapshots,
      linkedLiability.id,
      monthKey,
    );
    return (
      mortgageOutstandingShareToTotal(settings, linkedLiability, share) ??
      share ??
      0
    );
  }, [linkedLiability, monthKey, settings, snapshots]);

  const outstandingSharePreview = useMemo(() => {
    if (!linkedLiability || !isMortgageCapitalShared(settings, linkedLiability)) {
      return null;
    }
    return getMortgageBalanceShareInfoFromTotal(
      settings,
      linkedLiability,
      outstandingTotal,
    );
  }, [linkedLiability, outstandingTotal, settings]);

  const setHousing = (type) => {
    if (type === HOUSING_TYPE.MORTGAGE) enableMortgageTracking();
    else disableMortgageTracking();
  };

  const handleOutstandingChange = (total) => {
    if (!linkedLiability) return;
    const share = mortgageOutstandingTotalToShare(
      settings,
      linkedLiability,
      total,
    );
    setLiabilityOutstandingBalance(linkedLiability.id, share, monthKey);
    updateLiability(linkedLiability.id, {
      enteredOutstandingTotal: mortgageEnteredOutstandingTotal(total),
    });
  };

  return (
    <FormSection className="space-y-4">
      {inOnboarding ? (
        <FormFieldFrame
          layout="stacked"
          label={t('onboarding.expenses.housingTypeLabel')}
        >
          <div
            className="flex gap-2"
            role="group"
            aria-label={t('onboarding.expenses.housingTypeLabel')}
          >
            {[HOUSING_TYPE.MORTGAGE, HOUSING_TYPE.RENT].map((type) => {
              const active = housingType === type;
              return (
                <button
                  key={type}
                  type="button"
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                      : `border-slate-300 bg-transparent ${ui.textMuted} hover:border-slate-400 dark:border-slate-600`
                  }`}
                  aria-pressed={active}
                  onClick={() => setHousing(type)}
                >
                  {t(`onboarding.expenses.housingType.${type}`)}
                </button>
              );
            })}
          </div>
        </FormFieldFrame>
      ) : null}

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

      {inOnboarding && housingType === HOUSING_TYPE.MORTGAGE ? (
        <MoneyField
          id="onboarding-housing-outstanding"
          label={
            isMortgageCapitalShared(settings, linkedLiability)
              ? t('balance.patrimony.outstandingBalanceTotal')
              : t('balance.cashflow.housingDebtTitle')
          }
          hint={
            outstandingSharePreview
              ? t('balance.patrimony.outstandingBalanceSharePreview', {
                  share: formatMoney(outstandingSharePreview.yourShare),
                  percent: outstandingSharePreview.percent,
                })
              : isMortgageCapitalShared(settings, linkedLiability)
                ? t('balance.patrimony.outstandingBalanceSharedConfigHint')
                : t('balance.patrimony.outstandingBalanceHint')
          }
          value={outstandingTotal}
          onChange={handleOutstandingChange}
          fullWidth
          reserveHintSpace={false}
        />
      ) : null}

      {!inOnboarding && tracksMortgageCapital ? (
        <div className={`rounded-xl border px-3 py-3 text-sm ${ui.cardMuted}`}>
          <p className={`font-medium ${ui.textLabel}`}>
            {t('balance.cashflow.housingDebtTitle')}
          </p>
          {fullTotal != null ? (
            <>
              <p className="mt-1 text-lg font-semibold tabular-nums text-red-600 dark:text-red-400">
                {formatMoney(fullTotal)}
              </p>
              {balanceShare ? (
                <p className={`mt-1 text-xs ${ui.textMuted}`}>
                  {t('balance.cashflow.housingDebtShareHint', {
                    share: formatMoney(balanceShare.yourShare),
                    percent: balanceShare.percent,
                  })}
                </p>
              ) : null}
            </>
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
