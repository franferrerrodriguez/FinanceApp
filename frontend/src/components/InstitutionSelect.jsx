import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  INSTITUTION_OTHER_ID,
  institutionStorageValue,
  resolveInstitutionSelection,
} from '../lib/institutions';
import { ui } from '../lib/uiClasses';
import { SelectField } from './SelectField';

/**
 * Dropdown of institutions with "Other" + text field for custom names.
 * @param {string[]} institutionIds — ids including INSTITUTION_OTHER_ID last
 * @param {string} i18nKey — e.g. balance.banks
 * @param {Record<string, string>} [legacyMap]
 */
export function InstitutionSelect({
  institutionIds,
  i18nKey,
  legacyMap = {},
  value = '',
  onChange,
  optional = true,
  selectVariant = 'input',
  selectClassName = 'w-full py-2.5',
  otherPlaceholder,
}) {
  const { t } = useTranslation();

  const ids = useMemo(() => {
    const list = institutionIds.filter((id) => id !== INSTITUTION_OTHER_ID);
    if (!institutionIds.includes(INSTITUTION_OTHER_ID)) {
      list.push(INSTITUTION_OTHER_ID);
    }
    return list;
  }, [institutionIds]);

  const { key, custom } = resolveInstitutionSelection(value, ids, legacyMap);
  const showOtherInput = key === INSTITUTION_OTHER_ID;

  const sortedIds = useMemo(() => {
    const known = ids.filter((id) => id !== INSTITUTION_OTHER_ID);
    return [
      ...known.sort((a, b) =>
        t(`${i18nKey}.${a}`).localeCompare(t(`${i18nKey}.${b}`), undefined, {
          sensitivity: 'base',
        }),
      ),
      INSTITUTION_OTHER_ID,
    ];
  }, [ids, i18nKey, t]);

  const handleSelect = (nextKey) => {
    if (!nextKey) {
      onChange('');
      return;
    }
    if (nextKey === INSTITUTION_OTHER_ID) {
      onChange(institutionStorageValue(INSTITUTION_OTHER_ID, custom));
      return;
    }
    onChange(nextKey);
  };

  const handleCustom = (text) => {
    onChange(institutionStorageValue(INSTITUTION_OTHER_ID, text));
  };

  return (
    <div className="space-y-2">
      <SelectField
        variant={selectVariant}
        className={selectClassName}
        value={key}
        onChange={(e) => handleSelect(e.target.value)}
      >
        {optional ? (
          <option value="">{t('balance.institutionUnspecified')}</option>
        ) : null}
        {sortedIds.map((id) => (
          <option key={id} value={id}>
            {t(`${i18nKey}.${id}`)}
          </option>
        ))}
      </SelectField>
      {showOtherInput ? (
        <input
          type="text"
          value={custom}
          onChange={(e) => handleCustom(e.target.value)}
          placeholder={
            otherPlaceholder ?? t('balance.institutionOtherPlaceholder')
          }
          className={`${ui.input} w-full`}
        />
      ) : null}
    </div>
  );
}
