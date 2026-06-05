import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../context/ToastContext';
import {
  createCashflowEntry,
  getCurrentCashflowSegment,
  getCurrentMonthKey,
  isCurrentCashflowSegment,
} from '../lib/cashflowHistory';
import { ui } from '../lib/uiClasses';
import { SalaryEntryEditModal } from './SalaryEntryEditModal';
import { SalaryHistoryTable } from './SalaryHistoryTable';

export function CashflowTramosSection({
  items,
  settings,
  onAdd,
  onUpdate,
  onRemove,
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const [modal, setModal] = useState(null);

  const monthKeys = items.map((i) => i.effectiveFrom);
  const sorted = [...items].sort((a, b) =>
    b.effectiveFrom.localeCompare(a.effectiveFrom),
  );
  const canDelete = items.length > 1;

  const openCreate = () => {
    const segment = getCurrentCashflowSegment(items) ?? settings;
    setModal({
      mode: 'create',
      draft: createCashflowEntry(
        {
          effectiveFrom: getCurrentMonthKey(),
          monthlyNetSalary: segment?.monthlyNetSalary ?? 0,
          salaryPaysPreset: segment?.salaryPaysPreset ?? '12',
          numPagas: segment?.numPagas ?? 12,
          otherMonthlyIncome: segment?.otherMonthlyIncome ?? 0,
          expenses: segment?.expenses,
        },
        settings,
      ),
    });
  };

  const openEdit = (item) =>
    setModal({ mode: 'edit', id: item.id, draft: { ...item } });

  const closeModal = () => setModal(null);

  const handleSave = (entry) => {
    if (modal?.mode === 'create') {
      onAdd(entry);
      toast.success(t('toast.salaryCreated'));
    } else if (modal?.mode === 'edit') {
      onUpdate(modal.id, entry);
      toast.success(t('toast.salaryUpdated'));
    }
    closeModal();
  };

  const handleDelete = (item) => {
    if (!canDelete) return;
    if (modal?.mode === 'edit' && modal.id === item.id) closeModal();
    onRemove(item.id);
    toast.success(t('toast.salaryDeleted'));
  };

  const isCurrentItem = (item) => isCurrentCashflowSegment(item, items);

  return (
    <div className={ui.stackSection}>
      <div className={`border-b pb-3 ${ui.divider}`}>
        <h3 className={`text-base font-semibold ${ui.heading}`}>
          {t('balance.cashflow.tramosTitle')}
        </h3>
        <p className={`mt-1 text-sm ${ui.textMuted}`}>
          {t('balance.cashflow.tramosSubtitle')}
        </p>
      </div>

      {sorted.length > 0 ? (
        <SalaryHistoryTable
          items={sorted}
          isCurrentItem={isCurrentItem}
          onEdit={openEdit}
          onDelete={canDelete ? handleDelete : undefined}
          canDelete={canDelete}
        />
      ) : (
        <p className={`rounded-xl border border-dashed px-4 py-8 text-center text-sm ${ui.cardDashed} ${ui.text}`}>
          {t('balance.cashflow.salaryHistoryEmpty')}
        </p>
      )}

      <button
        type="button"
        onClick={openCreate}
        className={`${ui.btnSecondary} w-full sm:w-auto`}
      >
        {sorted.length > 0
          ? t('balance.cashflow.salaryHistoryAdd')
          : t('balance.cashflow.salaryHistoryAddFirst')}
      </button>

      <SalaryEntryEditModal
        open={modal != null}
        mode={modal?.mode ?? 'create'}
        initialDraft={
          modal?.draft ??
          createCashflowEntry({ effectiveFrom: getCurrentMonthKey() }, settings)
        }
        settings={settings}
        monthKeys={monthKeys}
        isCurrent={
          modal?.mode === 'edit' && modal?.id
            ? isCurrentCashflowSegment(
                items.find((i) => i.id === modal.id) ?? {},
                items,
              )
            : false
        }
        canDelete={canDelete}
        onClose={closeModal}
        onSave={handleSave}
        onDelete={() => {
          if (modal?.mode === 'edit') handleDelete({ id: modal.id });
        }}
      />
    </div>
  );
}
