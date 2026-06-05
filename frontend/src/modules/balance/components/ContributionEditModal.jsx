import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppModal } from '../../../components/AppModal';
import { FormFieldFrame } from '../../../components/FormFieldFrame';
import { displayToPct, pctToDisplay } from '../../../components/PercentRow';
import { SelectField } from '../../../components/SelectField';
import { isSavableContributionPlan } from '../../../lib/contributionPlanLabels';
import {
  getContributionEligibleAssets,
  getPlanAnnualReturn,
  resolveLinkedAsset,
  syncPlanWithAsset,
} from '../../../lib/contributionPlans';
import { ui } from '../../../lib/uiClasses';
import { formatPercent } from '../../../utils/formatters';

export function ContributionEditModal({
  open,
  mode,
  planId,
  initialDraft,
  assets,
  contributionPlans,
  settings,
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

  const selectableAssets = useMemo(() => {
    const linkedAsset = resolveLinkedAsset(draft, assets);
    const options = getContributionEligibleAssets(assets, planId, contributionPlans);
    return linkedAsset
      ? [linkedAsset, ...options.filter((a) => a.id !== linkedAsset.id)]
      : options;
  }, [draft, assets, planId, contributionPlans]);

  const linkedAsset = resolveLinkedAsset(draft, assets);
  const planReturn = getPlanAnnualReturn(settings, draft, assets);
  const canSave = isSavableContributionPlan(draft, assets);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={
        mode === 'create'
          ? t('balance.contributions.addContribution')
          : t('balance.contributions.editContribution')
      }
      footer={
        <>
          {mode === 'edit' ? (
            <button
              type="button"
              className={`mr-auto ${ui.actionLinkDanger}`}
              onClick={onDelete}
            >
              {t('balance.contributions.remove')}
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
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={draft.isActive !== false}
            onChange={(e) => patch({ isActive: e.target.checked })}
            className="h-4 w-4 rounded border-slate-400 text-emerald-500 focus:ring-emerald-500/40"
          />
          <span className={`text-sm font-medium ${ui.textLabel}`}>
            {t('balance.contributions.active')}
          </span>
        </label>

        <FormFieldFrame
          label={t('balance.contributions.asset')}
          hint={t('balance.contributions.assetModalHint')}
          reserveHintSpace={false}
        >
          {selectableAssets.length > 0 ? (
            <SelectField
              variant="input"
              className="w-full py-2.5"
              value={draft.assetId ?? ''}
              onChange={(e) => {
                const asset = assets.find((a) => a.id === e.target.value);
                patch(syncPlanWithAsset(draft, asset));
              }}
            >
              {!linkedAsset ? (
                <option value="">{t('balance.contributions.assetPlaceholder')}</option>
              ) : null}
              {selectableAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name || t('balance.contributions.unnamedAsset')}
                </option>
              ))}
            </SelectField>
          ) : (
            <p className={`text-sm ${ui.textMuted}`}>
              {t('balance.contributions.assetMissing')}
            </p>
          )}
          {linkedAsset ? (
            <p className={`mt-1.5 text-xs ${ui.textMuted}`}>
              {t(`categories.asset.${linkedAsset.category}`)} ·{' '}
              {t('balance.contributions.returnFromAsset', {
                rate: formatPercent(planReturn),
              })}
            </p>
          ) : draft.assetId ? (
            <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
              {t('balance.contributions.assetDeleted')}
            </p>
          ) : null}
        </FormFieldFrame>

        <FormFieldFrame
          label={t('balance.contributions.monthlyAmount')}
          reserveHintSpace={false}
        >
          <input
            type="number"
            min={0}
            step="10"
            value={draft.monthlyAmount ?? 0}
            onChange={(e) =>
              patch({
                monthlyAmount: Math.max(0, parseFloat(e.target.value) || 0),
              })
            }
            className={`${ui.input} ${ui.inputAmount} w-full`}
          />
        </FormFieldFrame>

        <FormFieldFrame
          label={t('balance.contributions.growthMode')}
          reserveHintSpace={false}
        >
          <SelectField
            variant="input"
            className="w-full py-2.5"
            value={draft.growthMode ?? 'fixed'}
            onChange={(e) => patch({ growthMode: e.target.value })}
          >
            <option value="fixed">{t('balance.contributions.growthFixed')}</option>
            <option value="ramp_monthly">
              {t('balance.contributions.growthRamp')}
            </option>
            <option value="annual_increase">
              {t('balance.contributions.growthAnnual')}
            </option>
          </SelectField>
        </FormFieldFrame>

        {draft.growthMode === 'ramp_monthly' ? (
          <FormFieldFrame
            label={t('balance.contributions.rampPerMonth')}
            reserveHintSpace={false}
          >
            <input
              type="number"
              min={0}
              step="10"
              value={draft.rampPerMonth ?? 0}
              onChange={(e) =>
                patch({
                  rampPerMonth: Math.max(0, parseFloat(e.target.value) || 0),
                })
              }
              className={`${ui.input} ${ui.inputAmount} w-full`}
            />
          </FormFieldFrame>
        ) : null}

        {draft.growthMode === 'annual_increase' ? (
          <FormFieldFrame
            label={t('balance.contributions.annualIncrease')}
            reserveHintSpace={false}
          >
            <div className="relative inline-block w-full max-w-[10rem]">
              <input
                type="number"
                step="0.1"
                min={0}
                max={30}
                value={pctToDisplay(draft.annualIncrease ?? 0)}
                onChange={(e) =>
                  patch({ annualIncrease: displayToPct(e.target.value) ?? 0 })
                }
                className={`${ui.inputPercent} w-full pr-7`}
              />
              <span
                className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs ${ui.textMuted}`}
              >
                %
              </span>
            </div>
          </FormFieldFrame>
        ) : null}
      </div>
    </AppModal>
  );
}
