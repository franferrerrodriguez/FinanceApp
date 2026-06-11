/** Detects placeholder rows that were saved without real user input. */

const DRAFT_LIABILITY_NAMES = new Set(['nuevo pasivo', 'new liability']);

/** @deprecated Use isSavableAssetCatalog from patrimonyNames.js in UI */
export function isDraftAsset(asset) {
  if (!asset) return true;
  const provider = (asset.provider ?? '').trim();
  if (provider) return false;
  return !['cash', 'real_estate'].includes(asset?.category);
}

export function isSavableLiability(liability) {
  if (!liability) return false;
  const name = (liability.name ?? '').trim();
  if (!name) return false;
  if (!Number.isFinite(Number(liability.interestRate))) return false;
  if (DRAFT_LIABILITY_NAMES.has(name.toLowerCase())) {
    const payment = liability.monthlyPayment ?? 0;
    const rate = Number(liability.interestRate);
    return payment > 0 || rate > 0;
  }
  return true;
}

export function isDraftLiability(liability) {
  return !isSavableLiability(liability);
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
