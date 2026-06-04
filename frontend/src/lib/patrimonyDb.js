export function mapAssetRow(asset, userId) {
  return {
    id: asset.id,
    user_id: userId,
    name: asset.name,
    category: asset.category,
    provider: asset.provider ?? null,
    notes: asset.notes ?? null,
    is_active: asset.isActive !== false,
  };
}

export function mapLiabilityRow(liability, userId) {
  return {
    id: liability.id,
    user_id: userId,
    name: liability.name,
    category: liability.category,
    monthly_payment: liability.monthlyPayment ?? 0,
    interest_rate: liability.interestRate ?? null,
    is_active: liability.isActive !== false,
  };
}

export function mapSnapshotRow(snapshot, userId) {
  return {
    id: snapshot.id,
    user_id: userId,
    asset_id: snapshot.assetId ?? null,
    liability_id: snapshot.liabilityId ?? null,
    snapshot_date: snapshot.snapshotDate ?? snapshot.date,
    value: snapshot.value,
    notes: snapshot.notes ?? null,
  };
}
