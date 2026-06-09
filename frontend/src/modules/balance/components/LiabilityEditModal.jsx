import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppModal } from '../../../components/AppModal';
import { FormFieldFrame } from '../../../components/FormFieldFrame';
import { SelectField } from '../../../components/SelectField';
import { getLiabilityCategories, getManualLiabilityCategories } from '../../../lib/categoryLabels';
import { isLinkedMortgageLiability } from '../../../lib/housingLiability';
import { isSavableLiability } from '../../../lib/patrimonyDrafts';
import { ui } from '../../../lib/uiClasses';

export function LiabilityEditModal({
  open,
  mode,
  initialDraft,
  settings = {},
  linkedMortgageId,
  onClose,
  onSave,
  onDelete,
}) {
  const { t } = useTranslation();
  const linkedId = linkedMortgageId ?? settings.linkedMortgageLiabilityId;
  const [draft, setDraft] = useState(initialDraft);

  useEffect(() => {
    if (open) setDraft(initialDraft);
  }, [open, initialDraft]);

  const isLinkedMortgage =
    mode === 'edit' && isLinkedMortgageLiability(draft, { linkedMortgageLiabilityId: linkedId });
  const categories = isLinkedMortgage
    ? getLiabilityCategories(t).filter((c) => c.value === 'mortgage')
    : getManualLiabilityCategories(t);

  const liabilityFields = { ...draft };
  delete liabilityFields.outstandingBalance;

  const canSave = isSavableLiability(liabilityFields);
  const patch = (p) => setDraft((prev) => ({ ...prev, ...p }));

  const handleSave = () => {
    const { outstandingBalance, ...fields } = draft;
    onSave({
      ...fields,
      outstandingBalance:
        outstandingBalance === '' || outstandingBalance == null
          ? null
          : Math.max(0, Number(outstandingBalance) || 0),
    });
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={
        mode === 'create'
          ? t('balance.patrimony.addLiability')
          : t('balance.patrimony.editLiability')
      }
      footer={
        <>
          {mode === 'edit' ? (
            <button
              type="button"
              className={`mr-auto ${ui.actionLinkDanger}`}
              onClick={onDelete}
            >
              {t('balance.patrimony.removeLiability')}
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
        <FormFieldFrame label={t('balance.patrimony.name')} required reserveHintSpace={false}>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => patch({ name: e.target.value })}
            className={`${ui.input} w-full`}
            autoFocus
          />
        </FormFieldFrame>

        <FormFieldFrame label={t('balance.patrimony.category')} reserveHintSpace={false}>
          <SelectField
            variant="input"
            className="w-full py-2.5"
            value={draft.category}
            onChange={(e) => patch({ category: e.target.value })}
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </SelectField>
        </FormFieldFrame>

        <FormFieldFrame
          label={t('balance.patrimony.monthlyPayment')}
          hint={
            isLinkedMortgage
              ? t('balance.patrimony.monthlyPaymentMortgageHint')
              : t('balance.patrimony.monthlyPaymentHint')
          }
          reserveHintSpace={false}
        >
          <input
            type="number"
            min={0}
            step="1"
            disabled={isLinkedMortgage}
            value={draft.monthlyPayment ?? 0}
            onChange={(e) =>
              patch({
                monthlyPayment: Math.max(0, parseFloat(e.target.value) || 0),
              })
            }
            className={`${ui.input} ${ui.inputAmount}${isLinkedMortgage ? ' opacity-60' : ''}`}
          />
        </FormFieldFrame>

        <FormFieldFrame
          label={t('balance.patrimony.outstandingBalance')}
          hint={t('balance.patrimony.outstandingBalanceHint')}
          reserveHintSpace={false}
        >
          <input
            type="number"
            min={0}
            step="1"
            value={draft.outstandingBalance ?? ''}
            placeholder="0"
            onChange={(e) => {
              const raw = e.target.value;
              patch({
                outstandingBalance: raw === '' ? '' : Math.max(0, parseFloat(raw) || 0),
              });
            }}
            className={`${ui.input} ${ui.inputAmount}`}
          />
        </FormFieldFrame>
      </div>
    </AppModal>
  );
}
