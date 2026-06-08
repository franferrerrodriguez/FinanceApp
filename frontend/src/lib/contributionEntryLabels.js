export function isSavableContributionEntry(entry, assets = []) {
  if (!entry?.assetId) return false;
  if ((entry.amount ?? 0) <= 0) return false;
  const asset = assets.find((a) => a.id === entry.assetId);
  return Boolean(asset && asset.isActive !== false);
}
