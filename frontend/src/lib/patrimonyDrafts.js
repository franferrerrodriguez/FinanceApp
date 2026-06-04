/** Detects placeholder rows that were saved without real user input. */

const DRAFT_ASSET_NAMES = new Set(['nuevo activo', 'new asset']);
const DRAFT_LIABILITY_NAMES = new Set(['nuevo pasivo', 'new liability']);

export function isDraftAsset(asset) {
  if (!asset) return true;
  const name = (asset.name ?? '').trim().toLowerCase();
  if (!name) return true;
  const provider = (asset.provider ?? '').trim();
  const notes = (asset.notes ?? '').trim();
  if (DRAFT_ASSET_NAMES.has(name) && !provider && !notes) return true;
  return false;
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

export function isSavableLiability(liability) {
  return !isDraftLiability(liability);
}
