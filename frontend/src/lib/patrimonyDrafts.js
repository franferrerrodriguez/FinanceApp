/** Detects placeholder rows that were saved without real user input. */

const DRAFT_LIABILITY_NAMES = new Set(['nuevo pasivo', 'new liability']);

/** @deprecated Use isSavableAssetCatalog from patrimonyNames.js in UI */
export function isDraftAsset(asset) {
  if (!asset) return true;
  const provider = (asset.provider ?? '').trim();
  if (provider) return false;
  return !['cash', 'real_estate'].includes(asset?.category);
}

export function isDraftLiability(liability) {
  if (!liability) return true;
  const name = (liability.name ?? '').trim().toLowerCase();
  if (!name) return true;
  if (DRAFT_LIABILITY_NAMES.has(name)) {
    const payment = liability.monthlyPayment ?? 0;
    const rate = liability.interestRate;
    return payment === 0 && (rate == null || rate === 0);
  }
  return false;
}

export function filterDraftAssets(assets = []) {
  return (assets ?? []).filter((a) => !isDraftAsset(a));
}

export function filterDraftLiabilities(liabilities = []) {
  return (liabilities ?? []).filter((l) => !isDraftLiability(l));
}

export function isSavableAsset(asset) {
  return !isDraftAsset(asset);
}

export { isSavableAssetCatalog } from './patrimonyNames.js';

export function isSavableLiability(liability) {
  return !isDraftLiability(liability);
}
