import { sumEuros } from './money.js';
import { getProjectionAnnualRate } from './projectionRates.js';
import {
  getAssetAnnualReturn,
  getPlanAnnualReturn,
  getReturnForCategory,
} from './projectionReturns.js';

export { getPlanAnnualReturn, getReturnForCategory } from './projectionReturns.js';

/** Asset categories that can receive planned monthly contributions (not bank — salary stays in liquid). */
export const CONTRIBUTION_ELIGIBLE_CATEGORIES = [
  'investment',
  'etf',
  'pension',
];

export function hasInvestmentDestinationAssets(assets = []) {
  return (assets ?? []).some(
    (asset) =>
      asset.isActive !== false &&
      PROJECTION_INVESTMENT_CATEGORIES.includes(asset.category),
  );
}

export function isContributionEligibleAsset(asset) {
  return (
    asset?.isActive !== false &&
    CONTRIBUTION_ELIGIBLE_CATEGORIES.includes(asset?.category)
  );
}

export function resolveLinkedAsset(plan, assets = []) {
  if (!plan?.assetId) return null;
  return assets.find((a) => a.id === plan.assetId) ?? null;
}

export function syncPlanWithAsset(plan, asset) {
  if (!asset) {
    return { ...plan, assetId: null };
  }
  return {
    ...plan,
    assetId: asset.id,
    providerId: asset.provider || plan.providerId || 'other',
    category: asset.category,
    label: asset.name ?? '',
    customAnnualReturn: null,
  };
}

export function getContributionEligibleAssets(assets = [], excludePlanId, plans = []) {
  const usedIds = new Set(
    (plans ?? [])
      .filter((p) => p.id !== excludePlanId && p.assetId)
      .map((p) => p.assetId),
  );
  return (assets ?? []).filter(
    (asset) => isContributionEligibleAsset(asset) && !usedIds.has(asset.id),
  );
}

export function migratePlansToAssets(plans = [], assets = []) {
  const eligible = (assets ?? []).filter(isContributionEligibleAsset);
  return (plans ?? []).map((plan) => {
    if (plan.assetId && resolveLinkedAsset(plan, assets)) return plan;
    const byProvider = eligible.filter(
      (a) =>
        plan.providerId &&
        a.provider === plan.providerId &&
        (!plan.category || a.category === plan.category),
    );
    if (byProvider.length === 1) return syncPlanWithAsset(plan, byProvider[0]);
    const byLabel = eligible.filter(
      (a) =>
        plan.label?.trim() &&
        a.name?.trim().toLowerCase() === plan.label.trim().toLowerCase(),
    );
    if (byLabel.length === 1) return syncPlanWithAsset(plan, byLabel[0]);
    return plan;
  });
}

/** Metadata per provider (contribution destination). */
export const PROVIDER_META = {
  indexa: { category: 'investment', returnKey: 'indexFund' },
  myinvestor: { category: 'investment', returnKey: 'indexFund' },
  scalable: { category: 'investment', returnKey: 'indexFund' },
  inbestme: { category: 'investment', returnKey: 'indexFund' },
  finizens: { category: 'investment', returnKey: 'indexFund' },
  tradeRepublic: { category: 'etf', returnKey: 'indexFund' },
  degiro: { category: 'etf', returnKey: 'indexFund' },
  interactiveBrokers: { category: 'etf', returnKey: 'indexFund' },
  etoro: { category: 'etf', returnKey: 'indexFund' },
  xtb: { category: 'etf', returnKey: 'indexFund' },
  renta4: { category: 'etf', returnKey: 'indexFund' },
  selfBank: { category: 'etf', returnKey: 'indexFund' },
  andbank: { category: 'etf', returnKey: 'indexFund' },
  freedom24: { category: 'etf', returnKey: 'indexFund' },
  lightyear: { category: 'etf', returnKey: 'indexFund' },
  revolut: { category: 'bank', returnKey: 'savings' },
  openbank: { category: 'bank', returnKey: 'savings' },
  ing: { category: 'bank', returnKey: 'savings' },
  n26: { category: 'bank', returnKey: 'savings' },
  wise: { category: 'bank', returnKey: 'savings' },
  pensionPlan: { category: 'pension', returnKey: 'pension' },
  other: { category: 'other', returnKey: 'indexFund' },
};

export const CONTRIBUTION_CATEGORIES = [
  'investment',
  'etf',
  'pension',
  'bank',
  'other',
];

/** Categories counted as additional investment in projection. */
export const PROJECTION_INVESTMENT_CATEGORIES = ['investment', 'etf', 'pension'];

export function createContributionPlan(partial = {}) {
  const providerId = partial.providerId ?? 'indexa';
  const meta = PROVIDER_META[providerId] ?? PROVIDER_META.other;

  return {
    id: partial.id ?? crypto.randomUUID?.() ?? `cp-${Date.now()}`,
    assetId: partial.assetId ?? null,
    providerId,
    category: partial.category ?? meta.category,
    label: partial.label ?? '',
    monthlyAmount: partial.monthlyAmount ?? 0,
    isActive: partial.isActive !== false,
    growthMode: partial.growthMode ?? 'fixed',
    rampPerMonth: partial.rampPerMonth ?? 0,
    annualIncrease: partial.annualIncrease ?? 0,
    customAnnualReturn:
      partial.customAnnualReturn === undefined
        ? null
        : partial.customAnnualReturn,
  };
}

export function resolvePlanAmountForMonth(plan, monthIndex) {
  if (!plan.isActive) return 0;

  let amount = plan.monthlyAmount ?? 0;

  if (plan.growthMode === 'ramp_monthly') {
    amount += (plan.rampPerMonth ?? 0) * monthIndex;
  }

  if (
    plan.growthMode === 'annual_increase' &&
    plan.annualIncrease > 0 &&
    monthIndex > 0 &&
    monthIndex % 12 === 0
  ) {
    amount *= 1 + plan.annualIncrease;
  }

  return Math.max(0, amount);
}

export function resolveInvestmentContributionsForMonth(plans, monthIndex) {
  const active = (plans ?? []).filter(
    (p) =>
      p.isActive &&
      PROJECTION_INVESTMENT_CATEGORIES.includes(p.category),
  );
  return sumEuros(
    ...active.map((plan) => resolvePlanAmountForMonth(plan, monthIndex)),
  );
}

export function hasProjectionInvestmentPlans(plans) {
  return (plans ?? []).some(
    (p) =>
      p.isActive &&
      PROJECTION_INVESTMENT_CATEGORIES.includes(p.category) &&
      (p.monthlyAmount ?? 0) > 0,
  );
}

export function resolveContributionsForMonth(plans, monthIndex) {
  const active = (plans ?? []).filter((p) => p.isActive);
  const breakdown = active.map((plan) => ({
    planId: plan.id,
    providerId: plan.providerId,
    category: plan.category,
    label: plan.label,
    amount: resolvePlanAmountForMonth(plan, monthIndex),
  }));

  const total = sumEuros(...breakdown.map((b) => b.amount));

  return { total, breakdown };
}

export function getTotalMonthlyContributions(plans) {
  return resolveContributionsForMonth(plans, 0).total;
}

export function hasActiveContributionAmounts(plans) {
  return (plans ?? []).some(
    (p) => p.isActive && (p.monthlyAmount ?? 0) > 0,
  );
}

export function getWeightedAnnualReturn(settings, plans, assets = []) {
  const active = (plans ?? []).filter((p) => p.isActive);
  if (!active.length) return getProjectionAnnualRate(settings);

  let weightedSum = 0;
  let weightTotal = 0;

  for (const plan of active) {
    const weight = plan.monthlyAmount ?? 0;
    if (weight <= 0) continue;
    weightedSum += weight * getPlanAnnualReturn(settings, plan, assets);
    weightTotal += weight;
  }

  if (weightTotal <= 0) return getProjectionAnnualRate(settings);
  return weightedSum / weightTotal;
}

/** UI helper: distinguish real weighted average vs global projection default. */
export function getWeightedReturnSummary(settings, plans, assets = []) {
  const hasWeighted = hasActiveContributionAmounts(plans);
  return {
    rate: hasWeighted
      ? getWeightedAnnualReturn(settings, plans, assets)
      : getProjectionAnnualRate(settings),
    isWeighted: hasWeighted,
  };
}

export function seedPlansFromLegacyInvestment(settings) {
  const amount = settings?.monthlyInvestmentAmount ?? 0;
  if (amount <= 0) return [];

  return [
    createContributionPlan({
      providerId: 'indexa',
      monthlyAmount: amount,
      label: '',
    }),
  ];
}
