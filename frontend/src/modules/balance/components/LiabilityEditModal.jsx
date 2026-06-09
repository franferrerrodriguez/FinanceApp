import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppModal } from '../../../components/AppModal';
import { ModalFormFooter } from '../../../components/ModalFormFooter';
import { MoneyField } from '../../../components/MoneyField';
import { SelectFormField } from '../../../components/SelectFormField';
import { TextField } from '../../../components/TextField';
import { getLiabilityCategories, getManualLiabilityCategories } from '../../../lib/categoryLabels';
import {
  getMortgageBalanceShareInfoFromTotal,
  getMortgageFullMonthlyPayment,
  getMortgageYourSharePayment,
  isLinkedMortgageLiability,
  isMortgageCapitalShared,
  mortgageEnteredOutstandingTotal,
  mortgageOutstandingTotalToShare,
} from '../../../lib/housingLiability';
import { formatMoney } from '../../../utils/formatters';
import { ui } from '../../../lib/uiClasses';
import { isSavableLiability } from '../../../lib/patrimonyDrafts';

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

  const outstandingTotal =
    draft.outstandingBalance === '' || draft.outstandingBalance == null
      ? null
      : Math.max(0, Number(draft.outstandingBalance) || 0);
  const balanceShare =
    isLinkedMortgage && outstandingTotal != null
      ? getMortgageBalanceShareInfoFromTotal(settings, draft, outstandingTotal)
      : null;
  const fullMonthlyPayment = isLinkedMortgage
    ? getMortgageFullMonthlyPayment(settings, draft)
    : draft.monthlyPayment ?? 0;
  const paymentShare = isLinkedMortgage
    ? getMortgageYourSharePayment(settings, draft)
    : null;

  const handleSave = () => {
    const { outstandingBalance, ...fields } = draft;
    const total =
      outstandingBalance === '' || outstandingBalance == null
        ? null
        : Math.max(0, Number(outstandingBalance) || 0);
    onSave({
      ...fields,
      outstandingBalance:
        total == null
          ? null
          : mortgageOutstandingTotalToShare(settings, draft, total),
      enteredOutstandingTotal:
        total == null ? undefined : mortgageEnteredOutstandingTotal(total),
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
        <ModalFormFooter
          onCancel={onClose}
          onSave={handleSave}
          canSave={canSave}
          onDelete={mode === 'edit' ? onDelete : undefined}
          deleteLabel={t('balance.patrimony.removeLiability')}
        />
      }
    >
      <div className="space-y-4">
        <TextField
          id="liability-name"
          label={t('balance.patrimony.name')}
          value={draft.name}
          onChange={(name) => patch({ name })}
          required
          reserveHintSpace={false}
          autoFocus
        />

        <SelectFormField
          id="liability-category"
          label={t('balance.patrimony.category')}
          value={draft.category}
          onChange={(category) => patch({ category })}
          reserveHintSpace={false}
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </SelectFormField>

        <MoneyField
          id="liability-monthly-payment"
          label={
            paymentShare
              ? t('balance.amortization.fullMonthlyPayment')
              : t('balance.patrimony.monthlyPayment')
          }
          hint={
            isLinkedMortgage
              ? t('balance.patrimony.monthlyPaymentMortgageHint')
              : t('balance.patrimony.monthlyPaymentHint')
          }
          hintAfter={
            paymentShare
              ? t('balance.patrimony.monthlyPaymentSharePreview', {
                  share: formatMoney(paymentShare.amount),
                  percent: paymentShare.percent,
                })
              : undefined
          }
          value={fullMonthlyPayment}
          onChange={(monthlyPayment) => patch({ monthlyPayment })}
          disabled={isLinkedMortgage}
          reserveHintSpace={false}
        />

        <MoneyField
          id="liability-outstanding-balance"
          label={
            isLinkedMortgage && isMortgageCapitalShared(settings, draft)
              ? t('balance.patrimony.outstandingBalanceTotal')
              : t('balance.patrimony.outstandingBalance')
          }
          hint={
            isLinkedMortgage && isMortgageCapitalShared(settings, draft)
              ? t('balance.patrimony.outstandingBalanceSharedConfigHint')
              : t('balance.patrimony.outstandingBalanceHint')
          }
          hintAfter={
            balanceShare
              ? t('balance.patrimony.outstandingBalanceSharePreview', {
                  share: formatMoney(balanceShare.yourShare),
                  percent: balanceShare.percent,
                })
              : undefined
          }
          value={draft.outstandingBalance ?? 0}
          onChange={(outstandingBalance) => patch({ outstandingBalance })}
          reserveHintSpace={false}
        />
      </div>
    </AppModal>
  );
}
