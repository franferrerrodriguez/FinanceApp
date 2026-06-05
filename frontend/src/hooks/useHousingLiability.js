import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createLinkedMortgageLiability,
  getLinkedMortgageLiability,
  HOUSING_TYPE,
} from '../lib/housingLiability';
import { useFinanceData } from '../store/hooks';

export function useHousingLiability() {
  const { t } = useTranslation();
  const {
    settings,
    setSettings,
    liabilities,
    addLiability,
    removeLiability,
  } = useFinanceData();

  const linkedLiability = getLinkedMortgageLiability(liabilities, settings);
  const housingType =
    settings.housingType ??
    (linkedLiability ? HOUSING_TYPE.MORTGAGE : HOUSING_TYPE.RENT);

  const setHousingType = useCallback(
    (nextType) => {
      if (nextType === HOUSING_TYPE.RENT) {
        const linked = getLinkedMortgageLiability(liabilities, settings);
        if (linked?.id === settings.linkedMortgageLiabilityId) {
          removeLiability(linked.id);
        }
        setSettings({
          housingType: HOUSING_TYPE.RENT,
          linkedMortgageLiabilityId: null,
        });
        return;
      }

      let linked = getLinkedMortgageLiability(liabilities, settings);
      if (!linked) {
        const created = createLinkedMortgageLiability(
          t('balance.cashflow.housingMortgageName'),
        );
        addLiability(created);
        setSettings({
          housingType: HOUSING_TYPE.MORTGAGE,
          linkedMortgageLiabilityId: created.id,
        });
        return;
      }

      setSettings({
        housingType: HOUSING_TYPE.MORTGAGE,
        linkedMortgageLiabilityId: linked.id,
      });
    },
    [addLiability, liabilities, removeLiability, setSettings, settings, t],
  );

  return {
    housingType,
    linkedLiability,
    setHousingType,
  };
}
