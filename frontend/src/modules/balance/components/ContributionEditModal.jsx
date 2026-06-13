import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppModal } from '../../../components/AppModal';
import { DateField } from '../../../components/DateField';
import { FormFieldFrame } from '../../../components/FormFieldFrame';
import { ModalFormFooter } from '../../../components/ModalFormFooter';
import { MoneyField } from '../../../components/MoneyField';
import { SelectFormField } from '../../../components/SelectFormField';
import { isSavableContributionEntry } from '../../../lib/contributionEntryLabels';
import {
  getContributionEntryAssets,
  resolveLinkedAsset,
} from '../../../lib/contributionEntries';
import { getAssetAnnualReturn } from '../../../lib/projectionReturns';
import { ui } from '../../../lib/uiClasses';
import { formatRatePercent } from '../../../utils/formatters';

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

  const assetHint = linkedAsset
    ? `${t(`categories.asset.${linkedAsset.category}`)} · ${t('balance.contributions.returnFromAsset', { rate: formatRatePercent(assetReturn) })}`
    : t('balance.contributions.assetModalHint');

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
        <ModalFormFooter
          onCancel={onClose}
          onSave={() => onSave(draft)}
          canSave={canSave}
          onDelete={mode === 'edit' ? onDelete : undefined}
          deleteLabel={t('balance.contributions.remove')}
        />
      }
    >
      <div className="space-y-4">
        {selectableAssets.length > 0 ? (
          <SelectFormField
            id={`contribution-asset-${entryId ?? 'new'}`}
            label={t('balance.contributions.asset')}
            hint={assetHint}
            value={draft.assetId ?? ''}
            onChange={(assetId) => {
              const asset = assets.find((a) => a.id === assetId);
              patch({ assetId: asset?.id ?? null });
            }}
            reserveHintSpace={false}
          >
            {!linkedAsset ? (
              <option value="">{t('balance.contributions.assetPlaceholder')}</option>
            ) : null}
            {selectableAssets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name || t('balance.contributions.unnamedAsset')}
              </option>
            ))}
          </SelectFormField>
        ) : (
          <FormFieldFrame
            label={t('balance.contributions.asset')}
            hint={t('balance.contributions.noAccounts')}
            reserveHintSpace={false}
          >
            <p className={`text-sm ${ui.textMuted}`}>
              {t('balance.contributions.noAccounts')}
            </p>
          </FormFieldFrame>
        )}

        {draft.assetId && !linkedAsset ? (
          <p className="text-xs text-[var(--color-warning)]">
            {t('balance.contributions.assetDeleted')}
          </p>
        ) : null}

        <DateField
          id={`contribution-date-${entryId ?? 'new'}`}
          label={t('balance.contributions.entryDate')}
          hint={t('balance.contributions.entryDateHint')}
          value={draft.date ?? ''}
          onChange={(date) => patch({ date })}
          reserveHintSpace={false}
        />

        <MoneyField
          id={`contribution-amount-${entryId ?? 'new'}`}
          label={t('balance.contributions.entryAmount')}
          value={draft.amount ?? 0}
          onChange={(amount) => patch({ amount })}
          reserveHintSpace={false}
        />
      </div>
    </AppModal>
  );
}
