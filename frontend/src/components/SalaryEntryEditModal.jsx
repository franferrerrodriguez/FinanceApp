import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { enrichCashflowEntry } from '../lib/cashflowHistory';
import { ui } from '../lib/uiClasses';
import { formatMoney } from '../utils/formatters';
import { MoneyField } from '../modules/onboarding/components/MoneyField';
import { AppModal } from './AppModal';
import { EffectiveMonthSelect } from './EffectiveMonthSelect';
import { FormFieldFrame } from './FormFieldFrame';

const PAY_PRESETS = ['12', '14', 'other'];

const PAY_INPUT = `${ui.input} h-11 min-h-[2.75rem] w-full max-w-none py-2.5 text-sm`;

export function SalaryEntryEditModal({
  open,
  mode,
  initialDraft,
  settings,
  monthKeys = [],
  isCurrent = false,
  canDelete = false,
  onClose,
  onSave,
  onDelete,
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(initialDraft);

  useEffect(() => {
    if (open) setDraft(initialDraft);
  }, [open, initialDraft]);

  const preview = useMemo(
    () => enrichCashflowEntry(draft, initialDraft, settings),
    [draft, initialDraft, settings],
  );

  const preset = draft.salaryPaysPreset ?? '12';
  const canSave = (draft.monthlyNetSalary ?? 0) > 0 && Boolean(draft.effectiveFrom);
  const patch = (p) => setDraft((prev) => ({ ...prev, ...p }));

  const handleSave = () => {
    onSave(enrichCashflowEntry(draft, initialDraft, settings));
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={
        mode === 'create'
          ? t('balance.cashflow.salaryModalAdd')
          : t('balance.cashflow.salaryModalEdit')
      }
      footer={
        <>
          {mode === 'edit' && canDelete ? (
            <button
              type="button"
              className={`mr-auto ${ui.actionLinkDanger}`}
              onClick={onDelete}
            >
              {t('balance.cashflow.salaryHistoryRemove')}
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
          label={t('balance.cashflow.salaryHistoryFrom')}
          hint={t('balance.cashflow.tramoDateHint')}
          required
          reserveHintSpace={false}
        >
          <EffectiveMonthSelect
            id={`salary-from-${initialDraft.id}`}
            value={draft.effectiveFrom}
            extraMonthKeys={monthKeys}
            onChange={(effectiveFrom) => patch({ effectiveFrom })}
            ariaLabel={t('balance.cashflow.salaryHistoryFrom')}
          />
        </FormFieldFrame>

        <MoneyField
          id={`salary-net-${initialDraft.id}`}
          label={t('balance.cashflow.salaryNormalLabel')}
          hint={t('balance.cashflow.salaryNormalHint')}
          value={draft.monthlyNetSalary ?? 0}
          onChange={(monthlyNetSalary) => patch({ monthlyNetSalary })}
          required
        />

        <FormFieldFrame
          label={t('balance.cashflow.salaryPaysLabel')}
          hint={t('balance.cashflow.tramoPaysHint')}
          reserveHintSpace={false}
        >
          <div className="flex flex-wrap items-center gap-2">
            {PAY_PRESETS.map((value) => (
              <label
                key={value}
                className={`inline-flex h-11 shrink-0 cursor-pointer items-center rounded-lg border px-3 text-sm ${
                  preset === value
                    ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/40'
                    : ui.cardMuted
                }`}
              >
                <input
                  type="radio"
                  name={`salary-pays-modal-${initialDraft.id}`}
                  className="sr-only"
                  checked={preset === value}
                  onChange={() =>
                    patch({
                      salaryPaysPreset: value,
                      numPagas:
                        value === '14' ? 14 : value === '12' ? 12 : draft.numPagas ?? 12,
                    })
                  }
                />
                {t(`balance.cashflow.salaryPays.${value}`)}
              </label>
            ))}
          </div>
          {preset === 'other' ? (
            <div className="mt-3 max-w-[6.5rem]">
              <label className={`mb-1 block text-xs font-medium ${ui.textLabel}`}>
                {t('balance.cashflow.salaryPaysCustom')}
              </label>
              <input
                type="number"
                min={1}
                max={24}
                step={1}
                value={draft.numPagas ?? 12}
                onChange={(e) =>
                  patch({
                    numPagas: Math.min(
                      24,
                      Math.max(1, parseInt(e.target.value, 10) || 12),
                    ),
                  })
                }
                className={`${PAY_INPUT} w-full`}
              />
            </div>
          ) : null}
        </FormFieldFrame>

        <MoneyField
          id={`salary-other-${initialDraft.id}`}
          label={t('onboarding.income.otherIncome')}
          hint={t('onboarding.income.otherIncomeHint')}
          value={draft.otherMonthlyIncome ?? 0}
          onChange={(otherMonthlyIncome) => patch({ otherMonthlyIncome })}
        />

        <p className={`text-sm ${ui.textMuted}`}>
          {t('balance.cashflow.salaryHistoryEffective', {
            amount: formatMoney(preview.monthlyNetSalaryEffective ?? 0),
          })}
        </p>

        {isCurrent ? (
          <p className={`text-xs ${ui.textMuted}`}>
            {t('balance.cashflow.tramosCurrentExpensesHint')}
          </p>
        ) : null}
      </div>
    </AppModal>
  );
}
