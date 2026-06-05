/** Short growth label for contribution table rows. */
export function formatContributionGrowthLabel(plan, t, formatMoney, formatPercent) {
  if (plan.growthMode === 'ramp_monthly') {
    return t('balance.contributions.tableGrowthRamp', {
      amount: formatMoney(plan.rampPerMonth ?? 0),
    });
  }
  if (plan.growthMode === 'annual_increase') {
    return t('balance.contributions.tableGrowthAnnual', {
      rate: formatPercent(plan.annualIncrease ?? 0),
    });
  }
  return t('balance.contributions.growthFixed');
}

export function isSavableContributionPlan(plan, assets = []) {
  if (!plan?.assetId) return false;
  const asset = assets.find((a) => a.id === plan.assetId);
  return Boolean(asset && asset.isActive !== false);
}
