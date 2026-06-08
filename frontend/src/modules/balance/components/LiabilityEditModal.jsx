import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppModal } from '../../../components/AppModal';
import { FormFieldFrame } from '../../../components/FormFieldFrame';
import { SelectField } from '../../../components/SelectField';
import { getManualLiabilityCategories } from '../../../lib/categoryLabels';
import { isSavableLiability } from '../../../lib/patrimonyDrafts';
import { ui } from '../../../lib/uiClasses';

export function LiabilityEditModal({
  open,
  mode,
  initialDraft,
  onClose,
  onSave,
  onDelete,
}) {
  const { t } = useTranslation();
  const categories = getManualLiabilityCategories(t);
  const [draft, setDraft] = useState(initialDraft);

  useEffect(() => {
    if (open) setDraft(initialDraft);
  }, [open, initialDraft]);

  const canSave = isSavableLiability(draft);
  const patch = (p) => setDraft((prev) => ({ ...prev, ...p }));

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
            onClick={() => onSave(draft)}
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
          hint={t('balance.patrimony.monthlyPaymentHint')}
          reserveHintSpace={false}
        >
          <input
            type="number"
            min={0}
            step="10"
            value={draft.monthlyPayment ?? 0}
            onChange={(e) =>
              patch({
                monthlyPayment: Math.max(0, parseFloat(e.target.value) || 0),
              })
            }
            className={`${ui.input} ${ui.inputAmount}`}
          />
        </FormFieldFrame>

        <FormFieldFrame
          label={t('balance.patrimony.interestRate')}
          hint={t('balance.patrimony.interestRateHint')}
          reserveHintSpace={false}
        >
          <input
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={draft.interestRate ?? ''}
            placeholder="—"
            onChange={(e) => {
              const raw = e.target.value;
              patch({
                interestRate:
                  raw === '' ? undefined : Math.max(0, parseFloat(raw) || 0),
              });
            }}
            className={`${ui.input} ${ui.inputAmount}`}
          />
        </FormFieldFrame>

        {mode === 'edit' ? (
          <div className={`rounded-xl border px-3 py-3 ${ui.cardMuted}`}>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={draft.isActive !== false}
                onChange={(e) => patch({ isActive: e.target.checked })}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-400 text-emerald-500 focus:ring-emerald-500/40 dark:border-slate-600 dark:bg-slate-900"
              />
              <span>
                <span className={`block text-sm font-medium ${ui.textLabel}`}>
                  {t('balance.patrimony.activeInClose')}
                </span>
                <span className={`mt-1 block text-xs leading-relaxed ${ui.textMuted}`}>
                  {t('balance.patrimony.activeInCloseHint')}
                </span>
              </span>
            </label>
          </div>
        ) : null}
      </div>
    </AppModal>
  );
}
