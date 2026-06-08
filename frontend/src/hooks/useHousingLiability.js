import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getLinkedMortgageLiability,
  HOUSING_TYPE,
} from '../lib/housingLiability';
import { useFinanceData } from '../store/hooks';

export function useHousingLiability() {
  const { t } = useTranslation();
  const { settings, liabilities, applyHousingType } = useFinanceData();

  const linkedLiability = getLinkedMortgageLiability(liabilities, settings);
  const tracksMortgageCapital = Boolean(linkedLiability);

  const enableMortgageTracking = useCallback(() => {
    applyHousingType(HOUSING_TYPE.MORTGAGE, {
      mortgageName: t('balance.cashflow.housingMortgageName'),
    });
  }, [applyHousingType, t]);

  const disableMortgageTracking = useCallback(() => {
    applyHousingType(HOUSING_TYPE.RENT);
  }, [applyHousingType]);

  return {
    linkedLiability,
    tracksMortgageCapital,
    enableMortgageTracking,
    disableMortgageTracking,
  };
}
