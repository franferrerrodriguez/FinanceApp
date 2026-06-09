import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FormSectionHeader } from '../../../components/FormSectionHeader';
import { getLiabilityCategories } from '../../../lib/categoryLabels';
import {
  isLinkedHousingMortgage,
  mortgageOutstandingShareToTotal,
} from '../../../lib/housingLiability';
import { getLiabilityOutstandingFromSnapshots } from '../../../lib/liabilitySnapshots';
import { getCurrentMonthKey } from '../../../lib/dashboardMetrics';
import { createLiability, getActiveLiabilities } from '../../../lib/patrimony';
import { ui } from '../../../lib/uiClasses';
import { useFinanceData } from '../../../store/hooks';
import { formatMoney } from '../../../utils/formatters';
import { LiabilityEditModal } from '../../balance/components/LiabilityEditModal';
import { PatrimonyCatalogTable } from '../../balance/components/PatrimonyCatalogTable';

export function OnboardingLiabilitiesSection() {
  const { t } = useTranslation();
  const monthKey = getCurrentMonthKey();
  const {
    settings,
    liabilities,
    snapshots,
    addLiability,
    updateLiability,
    removeLiability,
    setLiabilityOutstandingBalance,
  } = useFinanceData();

  const otherLiabilities = useMemo(
    () =>
      getActiveLiabilities(liabilities).filter(
        (item) => !isLinkedHousingMortgage(item, settings, liabilities),
      ),
    [liabilities, settings],
  );
  const categories = getLiabilityCategories(t);
  const categoryLabel = (cat) =>
    categories.find((c) => c.value === cat)?.label ?? cat;

  const [modal, setModal] = useState(null);

  const openCreate = () =>
    setModal({
      mode: 'create',
      draft: { ...createLiability({ name: '' }), outstandingBalance: '' },
    });
  const openEdit = (liability) => {
    const share = getLiabilityOutstandingFromSnapshots(
      snapshots,
      liability.id,
      monthKey,
    );
    setModal({
      mode: 'edit',
      id: liability.id,
      draft: {
        ...liability,
        outstandingBalance:
          mortgageOutstandingShareToTotal(settings, liability, share) ??
          share ??
          '',
      },
    });
  };

  const handleSave = (draft) => {
    const { outstandingBalance, enteredOutstandingTotal, ...fields } = draft;
    const liabilityPatch = {
      ...fields,
      ...(enteredOutstandingTotal != null ? { enteredOutstandingTotal } : {}),
    };
    if (modal?.mode === 'create') {
      const created = createLiability(liabilityPatch);
      addLiability(created);
      if (outstandingBalance != null) {
        setLiabilityOutstandingBalance(created.id, outstandingBalance, monthKey);
      }
    } else if (modal?.mode === 'edit') {
      updateLiability(modal.id, liabilityPatch);
      if (outstandingBalance != null) {
        setLiabilityOutstandingBalance(modal.id, outstandingBalance, monthKey);
      }
    }
    setModal(null);
  };

  const handleDeleteFromModal = () => {
    if (modal?.mode !== 'edit') return;
    const liability = liabilities.find((l) => l.id === modal.id);
    if (liability) removeLiability(liability.id);
    setModal(null);
  };

  return (
    <section className={`${ui.block} space-y-3 p-4`}>
      <FormSectionHeader
        title={t('onboarding.expenses.liabilitiesTitle')}
        hint={t('onboarding.expenses.liabilitiesHint')}
      />

      {otherLiabilities.length > 0 ? (
        <PatrimonyCatalogTable
          kind="liability"
          items={otherLiabilities}
          categoryLabel={categoryLabel}
          providerLabel={(item) => formatMoney(item.monthlyPayment ?? 0)}
          onEdit={openEdit}
          onDelete={(item) => removeLiability(item.id)}
        />
      ) : (
        <p className={`text-sm ${ui.textMuted}`}>
          {t('onboarding.expenses.liabilitiesEmpty')}
        </p>
      )}

      <button type="button" className={ui.btnSecondary} onClick={openCreate}>
        {otherLiabilities.length > 0
          ? t('onboarding.expenses.addAnotherLiability')
          : t('onboarding.expenses.addLiability')}
      </button>

      <LiabilityEditModal
        open={modal != null}
        mode={modal?.mode ?? 'create'}
        initialDraft={modal?.draft ?? createLiability({ name: '' })}
        settings={settings}
        linkedMortgageId={settings.linkedMortgageLiabilityId}
        onClose={() => setModal(null)}
        onSave={handleSave}
        onDelete={handleDeleteFromModal}
      />
    </section>
  );
}
