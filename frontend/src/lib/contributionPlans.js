import { sumEuros } from './money.js';
import { getProjectionAnnualRate } from './projectionRates.js';

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

export function getReturnForCategory(settings, category, customAnnualReturn) {
  if (customAnnualReturn != null && Number.isFinite(customAnnualReturn)) {
    return customAnnualReturn;
  }

  switch (category) {
    case 'pension':
      return getProjectionAnnualRate(settings);
    case 'bank':
      return settings?.savingsAccountReturn ?? 0.025;
    case 'investment':
    case 'etf':
    case 'other':
    default:
      return getProjectionAnnualRate(settings);
  }
}

export function getPlanAnnualReturn(settings, plan) {
  return getReturnForCategory(
    settings,
    plan.category,
    plan.customAnnualReturn,
  );
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

export function getWeightedAnnualReturn(settings, plans) {
  const active = (plans ?? []).filter((p) => p.isActive);
  if (!active.length) return getProjectionAnnualRate(settings);

  let weightedSum = 0;
  let weightTotal = 0;

  for (const plan of active) {
    const weight = plan.monthlyAmount ?? 0;
    if (weight <= 0) continue;
    weightedSum += weight * getPlanAnnualReturn(settings, plan);
    weightTotal += weight;
  }

  if (weightTotal <= 0) return getProjectionAnnualRate(settings);
  return weightedSum / weightTotal;
}

/** UI helper: distinguish real weighted average vs global projection default. */
export function getWeightedReturnSummary(settings, plans) {
  const hasWeighted = hasActiveContributionAmounts(plans);
  return {
    rate: hasWeighted
      ? getWeightedAnnualReturn(settings, plans)
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
