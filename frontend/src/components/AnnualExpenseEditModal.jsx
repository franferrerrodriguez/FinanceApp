import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createAnnualExpense } from '../lib/annualExpenses';
import { ui } from '../lib/uiClasses';
import { AppModal } from './AppModal';
import { FormFieldFrame } from './FormFieldFrame';
import { SelectField } from './SelectField';

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
        <>
          {mode === 'edit' ? (
            <button
              type="button"
              className={`mr-auto ${ui.actionLinkDanger}`}
              onClick={onDelete}
            >
              {t('balance.cashflow.annualExpenseRemove')}
            </button>
          ) : null}
          <button type="button" className={ui.btnSecondary} onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className={ui.btnPrimary}
            disabled={!canSave}
            onClick={handleSave}
          >
            {t('common.save')}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <FormFieldFrame
          label={t('balance.cashflow.annualExpenseName')}
          required
          reserveHintSpace={false}
        >
          <input
            type="text"
            value={draft.name ?? ''}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder={t('balance.cashflow.annualExpenseNamePlaceholder')}
            className={`${ui.input} w-full`}
            autoFocus
          />
        </FormFieldFrame>

        <FormFieldFrame
          label={t('balance.cashflow.annualExpenseAmount')}
          required
          reserveHintSpace={false}
        >
          <div className="relative max-w-[12rem]">
            <span
              className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm ${ui.textMuted}`}
            >
              €
            </span>
            <input
              type="number"
              min={0}
              step="1"
              value={draft.amount ?? 0}
              onChange={(e) =>
                patch({
                  amount: Math.max(0, parseFloat(e.target.value) || 0),
                })
              }
              className={`${ui.input} ${ui.inputMoney} w-full pl-9`}
            />
          </div>
        </FormFieldFrame>

        <FormFieldFrame
          label={t('balance.cashflow.annualExpenseMonth')}
          reserveHintSpace={false}
        >
          <SelectField
            variant="input"
            className="w-full max-w-[12rem] py-2.5"
            value={draft.month ?? 1}
            onChange={(e) => patch({ month: parseInt(e.target.value, 10) })}
          >
            {MONTH_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {t(`common.months.${m}`)}
              </option>
            ))}
          </SelectField>
        </FormFieldFrame>
      </div>
    </AppModal>
  );
}
