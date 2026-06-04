/** Shared institution picker: predefined id or free text when "other". */

export const INSTITUTION_OTHER_ID = 'other';

export function resolveInstitutionSelection(stored, ids, legacyMap = {}) {
  const known = ids.filter((id) => id !== INSTITUTION_OTHER_ID);
  const trimmed = String(stored ?? '').trim();
  if (!trimmed) return { key: '', custom: '' };
  if (known.includes(trimmed)) return { key: trimmed, custom: '' };
  if (trimmed === INSTITUTION_OTHER_ID) return { key: INSTITUTION_OTHER_ID, custom: '' };

  const legacy = legacyMap[trimmed];
  if (legacy && known.includes(legacy)) return { key: legacy, custom: '' };

  return { key: INSTITUTION_OTHER_ID, custom: trimmed };
}

export function institutionStorageValue(key, custom) {
  if (!key) return '';
  if (key === INSTITUTION_OTHER_ID) return String(custom ?? '').trim();
  return key;
}

/** @param {import('i18next').TFunction} t */
export function formatInstitutionLabel(value, ids, t, i18nKey, legacyMap = {}) {
  const { key, custom } = resolveInstitutionSelection(value, ids, legacyMap);
  if (!key) return '';
  if (key === INSTITUTION_OTHER_ID) return custom;
  return t(`${i18nKey}.${key}`, { defaultValue: custom || value });
}
