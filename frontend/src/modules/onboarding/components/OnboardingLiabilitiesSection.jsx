import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FormSectionHeader } from '../../../components/FormSectionHeader';
import { useHousingLiability } from '../../../hooks/useHousingLiability';
import { getLiabilityCategories } from '../../../lib/categoryLabels';
import {
  HOUSING_TYPE,
  getLiabilityMonthlyPaymentDisplay,
  inferHousingType,
  isLinkedHousingMortgage,
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
  const { enableMortgageTracking, disableMortgageTracking } = useHousingLiability();

  const housingType = inferHousingType(settings, liabilities);
  const catalogLiabilities = useMemo(
    () => getActiveLiabilities(liabilities),
    [liabilities],
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
    const outstanding = getLiabilityOutstandingFromSnapshots(
      snapshots,
      liability.id,
      monthKey,
    );
    setModal({
      mode: 'edit',
      id: liability.id,
      draft: { ...liability, outstandingBalance: outstanding ?? '' },
    });
  };

  const handleSave = (draft) => {
    const { outstandingBalance, ...fields } = draft;
    if (modal?.mode === 'create') {
      const created = createLiability(fields);
      addLiability(created);
      if (outstandingBalance != null) {
        setLiabilityOutstandingBalance(created.id, outstandingBalance, monthKey);
      }
    } else if (modal?.mode === 'edit') {
      updateLiability(modal.id, fields);
      if (outstandingBalance != null) {
        setLiabilityOutstandingBalance(modal.id, outstandingBalance, monthKey);
      }
    }
    setModal(null);
  };

  const handleDeleteFromModal = () => {
    if (modal?.mode !== 'edit') return;
    const liability = liabilities.find((l) => l.id === modal.id);
    if (liability) handleDelete(liability);
    setModal(null);
  };

  const handleDelete = (item) => {
    if (isLinkedHousingMortgage(item, settings, liabilities)) {
      disableMortgageTracking();
    } else {
      removeLiability(item.id);
    }
  };

  const setHousing = (type) => {
    if (type === HOUSING_TYPE.MORTGAGE) enableMortgageTracking();
    else disableMortgageTracking();
  };

  return (
    <section className={`${ui.block} space-y-3 p-4`}>
      <FormSectionHeader
        title={t('onboarding.expenses.liabilitiesTitle')}
        hint={t('onboarding.expenses.liabilitiesHint')}
      />

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

      {catalogLiabilities.length > 0 ? (
        <PatrimonyCatalogTable
          kind="liability"
          items={catalogLiabilities}
          categoryLabel={categoryLabel}
          providerLabel={(item) =>
            formatMoney(getLiabilityMonthlyPaymentDisplay(settings, item))
          }
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      ) : (
        <p className={`text-sm ${ui.textMuted}`}>
          {housingType === HOUSING_TYPE.RENT
            ? t('onboarding.expenses.rentOnlyHint')
            : t('onboarding.expenses.liabilitiesEmpty')}
        </p>
      )}

      <button type="button" className={ui.btnSecondary} onClick={openCreate}>
        {catalogLiabilities.length > 0
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
