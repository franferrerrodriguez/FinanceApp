import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../context/ToastContext';
import { createAnnualExpense } from '../lib/annualExpenses';
import { ui } from '../lib/uiClasses';
import { formatMoney } from '../utils/formatters';
import { AnnualExpenseEditModal } from './AnnualExpenseEditModal';
import { AnnualExpensesTable } from './AnnualExpensesTable';

function sortAnnualExpenses(items) {
  return [...items].sort((a, b) => {
    const monthDiff = (a.month ?? 1) - (b.month ?? 1);
    if (monthDiff !== 0) return monthDiff;
    return (a.name ?? '').localeCompare(b.name ?? '', undefined, {
      sensitivity: 'base',
    });
  });
}

export function AnnualExpensesSection({
  items,
  onAdd,
  onUpdate,
  onRemove,
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const [modal, setModal] = useState(null);

  const sorted = useMemo(() => sortAnnualExpenses(items), [items]);

  const openCreate = () =>
    setModal({ mode: 'create', draft: createAnnualExpense() });

  const openEdit = (item) =>
    setModal({ mode: 'edit', id: item.id, draft: { ...item } });

  const closeModal = () => setModal(null);

  const handleSave = (entry) => {
    if (modal?.mode === 'create') {
      onAdd(entry);
      toast.success(t('toast.annualExpenseAdded'));
    } else if (modal?.mode === 'edit') {
      onUpdate(modal.id, entry);
      toast.success(t('toast.annualExpenseUpdated'));
    }
    closeModal();
  };

  const handleDelete = (item) => {
    if (modal?.mode === 'edit' && modal.id === item.id) closeModal();
    onRemove(item.id);
    toast.success(t('toast.annualExpenseRemoved'));
  };

  return (
    <section className={`${ui.chartCard} ${ui.stackSection}`}>
      <div className={`border-b pb-3 ${ui.divider}`}>
        <h3 className={`text-base font-semibold ${ui.heading}`}>
          {t('balance.cashflow.annualExpensesTitle')}
        </h3>
        <p className={`mt-1 text-sm ${ui.textMuted}`}>
          {t('balance.cashflow.annualExpensesSubtitle')}
        </p>
      </div>

      {sorted.length > 0 ? (
        <AnnualExpensesTable
          items={sorted}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      ) : (
        <p
          className={`rounded-xl border border-dashed px-4 py-8 text-center text-sm ${ui.cardDashed} ${ui.text}`}
        >
          {t('balance.cashflow.annualExpensesEmpty')}
        </p>
      )}

      <button
        type="button"
        onClick={openCreate}
        className={`${ui.btnSecondary} w-full sm:w-auto`}
      >
        {sorted.length > 0
          ? t('balance.cashflow.annualExpenseAdd')
          : t('balance.cashflow.annualExpenseAddFirst')}
      </button>

      <AnnualExpenseEditModal
        open={modal != null}
        mode={modal?.mode ?? 'create'}
        initialDraft={modal?.draft ?? createAnnualExpense()}
        onClose={closeModal}
        onSave={handleSave}
        onDelete={() => {
          if (modal?.mode === 'edit') handleDelete({ id: modal.id });
        }}
      />
    </section>
  );
}

export function AnnualExpensesSummaryLine({ yearlyTotal, monthlyAvg }) {
  const { t } = useTranslation();
  if (yearlyTotal <= 0) return null;
  return (
    <p className={`text-sm ${ui.textMuted}`}>
      {t('dashboard.annualExpensesSummary', {
        yearly: formatMoney(yearlyTotal),
        monthly: formatMoney(monthlyAvg),
      })}
    </p>
  );
}
