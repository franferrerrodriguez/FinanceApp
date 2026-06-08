import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppModal } from '../../../components/AppModal';
import { FormFieldFrame } from '../../../components/FormFieldFrame';
import { SelectField } from '../../../components/SelectField';
import { isSavableContributionEntry } from '../../../lib/contributionEntryLabels';
import {
  getContributionEntryAssets,
  resolveLinkedAsset,
} from '../../../lib/contributionEntries';
import { getAssetAnnualReturn } from '../../../lib/projectionReturns';
import { MoneyField } from '../../onboarding/components/MoneyField';
import { ui } from '../../../lib/uiClasses';
import { formatPercent } from '../../../utils/formatters';

export function ContributionEditModal({
  open,
  mode,
  entryId,
  initialDraft,
  assets,
  settings,
  defaultDate,
  onClose,
  onSave,
  onDelete,
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(initialDraft);

  useEffect(() => {
    if (!open) return;
    setDraft({
      ...initialDraft,
      date: initialDraft?.date ?? defaultDate ?? new Date().toISOString().slice(0, 10),
    });
  }, [open, initialDraft, defaultDate]);

  const patch = (p) => setDraft((prev) => ({ ...prev, ...p }));

  const selectableAssets = useMemo(
    () => getContributionEntryAssets(assets),
    [assets],
  );

  const linkedAsset = resolveLinkedAsset(draft, assets);
  const assetReturn = linkedAsset
    ? getAssetAnnualReturn(settings, linkedAsset)
    : 0;
  const canSave = isSavableContributionEntry(draft, assets);

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
        <FormFieldFrame compact label={t('balance.contributions.asset')}>
          {selectableAssets.length > 0 ? (
            <SelectField
              variant="input"
              className="w-full py-2.5"
              value={draft.assetId ?? ''}
              onChange={(e) => {
                const asset = assets.find((a) => a.id === e.target.value);
                patch({ assetId: asset?.id ?? null });
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
              {t('balance.contributions.noAccounts')}
            </p>
          )}
          <p className={`mt-1.5 text-xs leading-relaxed ${ui.textMuted}`}>
            {linkedAsset
              ? `${t(`categories.asset.${linkedAsset.category}`)} · ${t('balance.contributions.returnFromAsset', { rate: formatPercent(assetReturn) })}`
              : t('balance.contributions.assetModalHint')}
          </p>
          {draft.assetId && !linkedAsset ? (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              {t('balance.contributions.assetDeleted')}
            </p>
          ) : null}
        </FormFieldFrame>

        <FormFieldFrame compact label={t('balance.contributions.entryDate')}>
          <input
            id="contribution-entry-date"
            type="date"
            value={draft.date ?? ''}
            onChange={(e) => patch({ date: e.target.value })}
            className={`${ui.input} w-full max-w-[12rem] py-2.5`}
          />
          <p className={`mt-1.5 text-xs leading-relaxed ${ui.textMuted}`}>
            {t('balance.contributions.entryDateHint')}
          </p>
        </FormFieldFrame>

        <MoneyField
          compact
          id="contribution-entry-amount"
          label={t('balance.contributions.entryAmount')}
          value={draft.amount ?? 0}
          onChange={(v) => patch({ amount: v })}
        />
      </div>
    </AppModal>
  );
}
