import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createAnnualExpense } from '../lib/annualExpenses';
import { AppModal } from './AppModal';
import { ModalFormFooter } from './ModalFormFooter';
import { MoneyField } from './MoneyField';
import { SelectFormField } from './SelectFormField';
import { TextField } from './TextField';

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

export function AnnualExpenseEditModal({
  open,
  mode,
  initialDraft,
  onClose,
  onSave,
  onDelete,
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(initialDraft);

  useEffect(() => {
    if (open) setDraft(initialDraft);
  }, [open, initialDraft]);

  const patch = (p) => setDraft((prev) => ({ ...prev, ...p }));
  const canSave =
    (draft.name ?? '').trim().length > 0 && (draft.amount ?? 0) > 0;

  const handleSave = () => {
    onSave(
      createAnnualExpense({
        ...draft,
        name: draft.name?.trim() ?? '',
        amount: Math.max(0, draft.amount ?? 0),
        month: draft.month ?? 1,
      }),
    );
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={
        mode === 'create'
          ? t('balance.cashflow.annualExpenseModalAdd')
          : t('balance.cashflow.annualExpenseModalEdit')
      }
      footer={
        <ModalFormFooter
          onCancel={onClose}
          onSave={handleSave}
          canSave={canSave}
          onDelete={mode === 'edit' ? onDelete : undefined}
          deleteLabel={t('balance.cashflow.annualExpenseRemove')}
        />
      }
    >
      <div className="space-y-4">
        <TextField
          id="annual-expense-name"
          label={t('balance.cashflow.annualExpenseName')}
          value={draft.name ?? ''}
          onChange={(name) => patch({ name })}
          placeholder={t('balance.cashflow.annualExpenseNamePlaceholder')}
          required
          reserveHintSpace={false}
        />

        <MoneyField
          id="annual-expense-amount"
          label={t('balance.cashflow.annualExpenseAmount')}
          value={draft.amount ?? 0}
          onChange={(amount) => patch({ amount })}
          required
          reserveHintSpace={false}
        />

        <SelectFormField
          id="annual-expense-month"
          label={t('balance.cashflow.annualExpenseMonth')}
          value={draft.month ?? 1}
          onChange={(month) => patch({ month: parseInt(month, 10) })}
          selectClassName="max-w-none sm:max-w-[12rem]"
          reserveHintSpace={false}
        >
          {MONTH_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {t(`common.months.${m}`)}
            </option>
          ))}
        </SelectFormField>
      </div>
    </AppModal>
  );
}
