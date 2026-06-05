import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppModal } from '../../../components/AppModal';
import { FormFieldFrame } from '../../../components/FormFieldFrame';
import { InstitutionSelect } from '../../../components/InstitutionSelect';
import { displayToPct, pctToDisplay } from '../../../components/PercentRow';
import { SelectField } from '../../../components/SelectField';
import { getAssetCategories } from '../../../lib/categoryLabels';
import { isSavableAssetCatalog } from '../../../lib/patrimonyNames';
import { getDefaultReturnForAssetCategory } from '../../../lib/projectionReturns';
import {
  SPANISH_BANK_IDS,
  SPANISH_BANK_LEGACY_LABELS,
} from '../../../lib/spanishBanks';
import { ui } from '../../../lib/uiClasses';
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
        <>
          {mode === 'edit' ? (
            <button
              type="button"
              className={`mr-auto ${ui.actionLinkDanger}`}
              onClick={onDelete}
            >
              {t('balance.patrimony.removeAsset')}
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
            {t('balance.patrimony.activeInClose')}
          </span>
        </label>

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

        <FormFieldFrame label={t('balance.patrimony.category')} reserveHintSpace={false}>
          <SelectField
            variant="input"
            className="w-full py-2.5"
            value={draft.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </SelectField>
        </FormFieldFrame>

        {showReturn ? (
          <FormFieldFrame
            label={t('balance.patrimony.assetReturnLabel')}
            hint={t('balance.patrimony.assetReturnHint')}
            reserveHintSpace={false}
          >
            <div className="relative inline-block shrink-0">
              <input
                type="number"
                step="0.1"
                min={0}
                max={30}
                value={pctToDisplay(
                  draft.customAnnualReturn ??
                    getDefaultReturnForAssetCategory(draft.category, settings),
                )}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    patch({ customAnnualReturn: null });
                    return;
                  }
                  patch({ customAnnualReturn: displayToPct(raw) ?? 0 });
                }}
                className={`${ui.inputPercent} pr-7`}
              />
              <span
                className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs ${ui.textMuted}`}
              >
                %
              </span>
            </div>
          </FormFieldFrame>
        ) : null}

        <FormFieldFrame
          label={t('balance.patrimony.notes')}
          hint={t('balance.patrimony.notesHint')}
          reserveHintSpace={false}
        >
          <input
            type="text"
            value={draft.notes ?? ''}
            placeholder={t('common.optional')}
            onChange={(e) => patch({ notes: e.target.value })}
            className={`${ui.input} w-full`}
          />
        </FormFieldFrame>
      </div>
    </AppModal>
  );
}
