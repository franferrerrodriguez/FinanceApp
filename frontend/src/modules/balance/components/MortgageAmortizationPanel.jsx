import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { getCurrentMonthKey } from '../../../lib/dashboardMetrics';
import {
  getMortgageBalanceShareInfo,
  getMortgageFullMonthlyPayment,
  getMortgageFullOutstandingBalance,
  getMortgageOutstandingBalance,
  getMortgageYourSharePayment,
} from '../../../lib/housingLiability';
import { balancePath, BALANCE_TAB } from '../../../lib/balanceTabs';
import { getActiveLiabilities } from '../../../lib/patrimony';
import { ui } from '../../../lib/uiClasses';
import { useFinanceData } from '../../../store/hooks';
import { formatMoney } from '../../../utils/formatters';
import { AmortizationCalculator } from './AmortizationCalculator';

export function MortgageAmortizationPanel() {
  const { t } = useTranslation();
  const { settings, liabilities, snapshots } = useFinanceData();
  const monthKey = getCurrentMonthKey();

  const mortgages = useMemo(
    () =>
      getActiveLiabilities(liabilities).filter(
        (liability) => liability.category === 'mortgage',
      ),
    [liabilities],
  );

  const [selectedId, setSelectedId] = useState(null);
  const selectedMortgage =
    mortgages.find((m) => m.id === selectedId) ?? mortgages[0] ?? null;

  if (!mortgages.length) {
    return (
      <div className={`${ui.chartCard} px-6 py-10 text-center`}>
        <p className={`text-sm ${ui.text}`}>{t('balance.amortization.empty')}</p>
        <Link
          to={balancePath(BALANCE_TAB.PATRIMONY)}
          className={`mt-4 inline-block text-sm font-medium text-[var(--accent)] underline-offset-2 hover:underline`}
        >
          {t('balance.amortization.goToPatrimony')}
        </Link>
      </div>
    );
  }

  const yourShareCapital = getMortgageOutstandingBalance(
    snapshots,
    selectedMortgage,
    monthKey,
  );
  const fullCapital = getMortgageFullOutstandingBalance(
    settings,
    snapshots,
    selectedMortgage,
    monthKey,
  );
  const balanceShareInfo = getMortgageBalanceShareInfo(
    settings,
    selectedMortgage,
    yourShareCapital,
  );
  const fullMonthlyPayment = getMortgageFullMonthlyPayment(
    settings,
    selectedMortgage,
  );
  const yourSharePayment = getMortgageYourSharePayment(
    settings,
    selectedMortgage,
  );

  return (
    <div className={`${ui.chartCard} ${ui.stackSection}`}>
        <div>
          <h3 className={`text-base font-semibold ${ui.heading}`}>
            {t('balance.amortization.title')}
          </h3>
          <p className={`mt-1 text-sm ${ui.text}`}>
            {t('balance.amortization.subtitle')}
          </p>
          {yourSharePayment ? (
            <p className={`mt-2 text-sm ${ui.textMuted}`}>
              {t('balance.amortization.sharedMortgageNote', {
                fullPayment: formatMoney(fullMonthlyPayment),
                totalCapital: formatMoney(fullCapital ?? 0),
                yourPayment: formatMoney(yourSharePayment.amount),
                sharePercent: `${yourSharePayment.percent}%`,
              })}
            </p>
          ) : null}
        </div>

        {mortgages.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {mortgages.map((mortgage) => (
              <button
                key={mortgage.id}
                type="button"
                className={
                  selectedMortgage.id === mortgage.id
                    ? ui.scenarioChipActive
                    : ui.scenarioChip
                }
                onClick={() => setSelectedId(mortgage.id)}
              >
                {mortgage.name}
              </button>
            ))}
          </div>
        ) : null}

      <AmortizationCalculator
        key={selectedMortgage.id}
        fullCapital={fullCapital}
        balanceShareInfo={balanceShareInfo}
        monthlyPayment={fullMonthlyPayment}
        yourSharePayment={yourSharePayment}
        annualRate={selectedMortgage.interestRate}
      />
    </div>
  );
}
