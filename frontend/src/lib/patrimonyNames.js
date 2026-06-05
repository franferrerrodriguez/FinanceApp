/** Display names for patrimony catalog lines (provider + auto suffix). */

export function getAssetBaseLabel(asset, formatProvider, categoryLabel) {
  const fromProvider = formatProvider(asset?.provider)?.trim();
  if (fromProvider) return fromProvider;
  return categoryLabel(asset?.category)?.trim() ?? '';
}

/**
 * Assigns names in list order: one line → "Bankinter"; duplicates → "Bankinter", "Bankinter 2", …
 */
export function applyAutoAssetNames(assets, getBaseLabel) {
  const totals = new Map();
  for (const asset of assets) {
    const key = getBaseLabel(asset).toLowerCase();
    if (!key) continue;
    totals.set(key, (totals.get(key) ?? 0) + 1);
  }

  const seen = new Map();
  return assets.map((asset) => {
    const base = getBaseLabel(asset);
    if (!base) return { ...asset, name: '' };

    const key = base.toLowerCase();
    const index = (seen.get(key) ?? 0) + 1;
    seen.set(key, index);

    const total = totals.get(key) ?? 1;
    const name = total === 1 ? base : index === 1 ? base : `${base} ${index}`;

    return { ...asset, name };
  });
}

/** @param {import('./patrimony.js').Asset} asset */
export function isSavableAssetCatalog(asset) {
  if (!asset) return false;
  const provider = (asset.provider ?? '').trim();
  if (provider) return true;
  return ['cash', 'real_estate'].includes(asset.category);
}
