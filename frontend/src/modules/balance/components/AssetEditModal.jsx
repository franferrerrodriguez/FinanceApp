import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppModal } from '../../../components/AppModal';
import { FormCheckboxField } from '../../../components/FormCheckboxField';
import { FormFieldFrame } from '../../../components/FormFieldFrame';
import { FormSection } from '../../../components/FormSection';
import { InstitutionSelect } from '../../../components/InstitutionSelect';
import { ModalFormFooter } from '../../../components/ModalFormFooter';
import { MoneyInput } from '../../../components/MoneyInput';
import { PercentField } from '../../../components/PercentField';
import { SelectFormField } from '../../../components/SelectFormField';
import { TextField } from '../../../components/TextField';
import { getAssetCategories } from '../../../lib/categoryLabels';
import { isSavableAssetCatalog } from '../../../lib/patrimonyNames';
import { getDefaultReturnForAssetCategory } from '../../../lib/projectionReturns';
import {
  SPANISH_BANK_IDS,
  SPANISH_BANK_LEGACY_LABELS,
} from '../../../lib/spanishBanks';
import { useSettings } from '../../../store/hooks';

const ZERO_RETURN_CATEGORIES = new Set(['cash', 'real_estate']);

export function AssetEditModal({
  open,
  mode,
  initialDraft,
  onClose,
  onSave,
  onDelete,
}) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const categories = getAssetCategories(t);
  const [draft, setDraft] = useState(initialDraft);

  useEffect(() => {
    if (open) setDraft(initialDraft);
  }, [open, initialDraft]);

  const canSave = isSavableAssetCatalog(draft);
  const providerOptional = ['cash', 'real_estate'].includes(draft.category);
  const showReturn = !ZERO_RETURN_CATEGORIES.has(draft.category);

  const patch = (p) => setDraft((prev) => ({ ...prev, ...p }));

  const handleCategoryChange = (category) => {
    patch({
      category,
      customAnnualReturn: getDefaultReturnForAssetCategory(category, settings),
    });
  };

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title={
        mode === 'create'
          ? t('balance.patrimony.addAsset')
          : t('balance.patrimony.editAsset')
      }
      footer={
        <ModalFormFooter
          onCancel={onClose}
          onSave={() => onSave(draft)}
          canSave={canSave}
          onDelete={mode === 'edit' ? onDelete : undefined}
          deleteLabel={t('balance.patrimony.removeAsset')}
        />
      }
    >
      <div className="space-y-4">
        <FormFieldFrame
          label={t('balance.patrimony.provider')}
          hint={
            providerOptional
              ? t('balance.patrimony.providerOptionalHint')
              : t('balance.patrimony.providerRequiredHint')
          }
          required={!providerOptional}
          reserveHintSpace={false}
        >
          <InstitutionSelect
            institutionIds={SPANISH_BANK_IDS}
            i18nKey="balance.banks"
            legacyMap={SPANISH_BANK_LEGACY_LABELS}
            value={draft.provider ?? ''}
            onChange={(provider) => patch({ provider })}
          />
        </FormFieldFrame>

        <SelectFormField
          id="asset-category"
          label={t('balance.patrimony.category')}
          value={draft.category}
          onChange={handleCategoryChange}
          reserveHintSpace={false}
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </SelectFormField>

        {mode === 'create' ? (
          <FormFieldFrame
            label={t('balance.patrimony.initialBalance')}
            hint={t('balance.patrimony.initialBalanceHint')}
            reserveHintSpace={false}
          >
            <MoneyInput
              id="asset-initial-balance"
              value={draft.initialBalance ?? null}
              onChange={(initialBalance) => patch({ initialBalance })}
            />
          </FormFieldFrame>
        ) : null}

        {showReturn ? (
          <PercentField
            id="asset-return"
            label={t('balance.patrimony.assetReturnLabel')}
            hint={t('balance.patrimony.assetReturnHint')}
            value={draft.customAnnualReturn}
            onChange={(customAnnualReturn) => patch({ customAnnualReturn })}
            nullable
            reserveHintSpace={false}
          />
        ) : null}

        <TextField
          id="asset-notes"
          label={t('balance.patrimony.notes')}
          hint={t('balance.patrimony.notesHint')}
          value={draft.notes ?? ''}
          onChange={(notes) => patch({ notes })}
          placeholder={t('common.optional')}
          reserveHintSpace={false}
        />

        {mode === 'edit' ? (
          <FormSection>
            <FormCheckboxField
              id="asset-active-in-close"
              checked={draft.isActive !== false}
              onChange={(isActive) => patch({ isActive })}
              label={t('balance.patrimony.activeInClose')}
              hint={t('balance.patrimony.activeInCloseHint')}
            />
          </FormSection>
        ) : null}
      </div>
    </AppModal>
  );
}
