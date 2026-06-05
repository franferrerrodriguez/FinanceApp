import { annualToMonthlyRate } from './calculations.js';
import { getCurrentMonthKey } from './dashboardMetrics.js';
import { sumEuros } from './money.js';
import {
  resolveContributionsForMonth,
  resolveInvestmentContributionsForMonth,
} from './contributionPlans.js';
import {
  getSnapshotAssetId,
  getSnapshotLiabilityId,
  groupSnapshotsByMonth,
} from './snapshotUtils.js';
import { liabilityMonthlyPaymentForProjection } from './housingLiability.js';
import {
  getAssetAnnualReturn,
  getDefaultReturnForAssetCategory,
} from './projectionReturns.js';

export const GROWTH_BUCKETS = [
  'liquid',
  'investment',
  'pension',
  'real_estate',
  'other',
];

export function createEmptyBuckets() {
  return Object.fromEntries(GROWTH_BUCKETS.map((k) => [k, 0]));
}

export function assetCategoryToBucket(category) {
  switch (category) {
    case 'bank':
    case 'cash':
      return 'liquid';
    case 'investment':
    case 'etf':
      return 'investment';
    case 'pension':
      return 'pension';
    case 'real_estate':
      return 'real_estate';
    default:
      return 'other';
  }
}

export function planCategoryToBucket(category) {
  return assetCategoryToBucket(category);
}

export function sumBucketBalances(buckets) {
  return sumEuros(...GROWTH_BUCKETS.map((k) => buckets[k] ?? 0));
}

export function netWorthFromState(buckets, debtBalance = 0) {
  return round(sumBucketBalances(buckets) - Math.max(0, debtBalance));
}

function round(value) {
  return Math.round((value ?? 0) * 100) / 100;
}

/** Build starting buckets from snapshots, or fallback initial patrimony → investment. */
export function buildInitialBucketState({
  settings,
  assets = [],
  liabilities = [],
  snapshots = [],
  initialPatrimony = 0,
  monthKey = getCurrentMonthKey(),
}) {
  const buckets = createEmptyBuckets();
  let debtBalance = 0;
  const assetMap = Object.fromEntries((assets ?? []).map((a) => [a.id, a]));
  const monthSnaps = groupSnapshotsByMonth(snapshots)[monthKey] ?? [];

  if (monthSnaps.length > 0) {
    for (const snap of monthSnaps) {
      const assetId = getSnapshotAssetId(snap);
      const liabilityId = getSnapshotLiabilityId(snap);
      const value = Number(snap.value) || 0;

      if (assetId && assetMap[assetId]?.isActive !== false) {
        const bucket = assetCategoryToBucket(assetMap[assetId].category);
        buckets[bucket] = round((buckets[bucket] ?? 0) + Math.max(0, value));
      } else if (liabilityId) {
        const liability = (liabilities ?? []).find((l) => l.id === liabilityId);
        if (liability?.isActive !== false) {
          debtBalance = round(debtBalance + Math.abs(value));
        }
      }
    }
  } else if ((initialPatrimony ?? 0) > 0) {
    buckets.investment = round(initialPatrimony);
  }

  const bucketRates = computeBucketAnnualRates({
    settings,
    assets,
    snapshots,
    monthKey,
    buckets,
  });

  return {
    buckets,
    debtBalance,
    bucketRates,
    fromSnapshots: monthSnaps.length > 0,
  };
}

/** Weighted annual rate per bucket from asset lines (category defaults + overrides). */
export function computeBucketAnnualRates({
  settings,
  assets = [],
  snapshots = [],
  monthKey = getCurrentMonthKey(),
  buckets = createEmptyBuckets(),
}) {
  const rates = Object.fromEntries(GROWTH_BUCKETS.map((k) => [k, 0]));
  const weights = createEmptyBuckets();
  const assetMap = Object.fromEntries((assets ?? []).map((a) => [a.id, a]));
  const monthSnaps = groupSnapshotsByMonth(snapshots)[monthKey] ?? [];

  for (const snap of monthSnaps) {
    const assetId = getSnapshotAssetId(snap);
    if (!assetId) continue;
    const asset = assetMap[assetId];
    if (!asset || asset.isActive === false) continue;
    const amount = Math.max(0, Number(snap.value) || 0);
    if (amount <= 0) continue;
    const bucket = assetCategoryToBucket(asset.category);
    weights[bucket] += amount;
    rates[bucket] += amount * getAssetAnnualReturn(settings, asset);
  }

  for (const bucket of GROWTH_BUCKETS) {
    if (weights[bucket] > 0) {
      rates[bucket] = rates[bucket] / weights[bucket];
    } else if ((buckets[bucket] ?? 0) > 0) {
      rates[bucket] = defaultRateForBucket(settings, bucket);
    }
  }

  return rates;
}

const BUCKET_DEFAULT_CATEGORY = {
  liquid: 'bank',
  pension: 'pension',
  real_estate: 'real_estate',
  investment: 'investment',
  other: 'other',
};

function defaultRateForBucket(settings, bucket) {
  return getDefaultReturnForAssetCategory(
    BUCKET_DEFAULT_CATEGORY[bucket] ?? 'other',
    settings,
  );
}

export function computeWeightedPortfolioReturn(buckets, bucketRates) {
  let weightedSum = 0;
  let total = 0;
  for (const bucket of GROWTH_BUCKETS) {
    const balance = buckets[bucket] ?? 0;
    if (balance <= 0) continue;
    weightedSum += balance * (bucketRates[bucket] ?? 0);
    total += balance;
  }
  if (total <= 0) return 0;
  return weightedSum / total;
}

export function splitContributionsToBuckets(plans, monthIndex, netContribution) {
  const bucketContrib = createEmptyBuckets();
  const additionalInvestments = resolveInvestmentContributionsForMonth(
    plans,
    monthIndex,
  );
  const freeSavings = round(netContribution - additionalInvestments);
  bucketContrib.liquid += freeSavings;

  const { breakdown } = resolveContributionsForMonth(plans, monthIndex);
  for (const item of breakdown) {
    if (item.amount <= 0) continue;
    const bucket = planCategoryToBucket(item.category);
    if (
      item.category === 'investment' ||
      item.category === 'etf' ||
      item.category === 'pension'
    ) {
      bucketContrib[bucket] = round(bucketContrib[bucket] + item.amount);
    }
  }

  return bucketContrib;
}

function liabilityPayment(settings, liability) {
  return liabilityMonthlyPaymentForProjection(settings, liability);
}

function computeDebtMonthDelta(debtBalance, liabilities = [], settings = {}) {
  const active = (liabilities ?? []).filter((l) => l.isActive !== false);
  if (debtBalance <= 0 || !active.length) {
    return {
      interest: 0,
      payments: sumEuros(...active.map((l) => liabilityPayment(settings, l))),
    };
  }

  let weightedRate = 0;
  let weightTotal = 0;
  for (const liability of active) {
    const rate = liability.interestRate ?? 0;
    if (rate > 0) {
      weightedRate += rate;
      weightTotal += 1;
    }
  }
  const annualDebtRate = weightTotal > 0 ? weightedRate / weightTotal : 0;
  const interest = round(debtBalance * annualToMonthlyRate(annualDebtRate));
  const payments = sumEuros(...active.map((l) => liabilityPayment(settings, l)));
  return { interest, payments };
}

/** One projection month: returns on buckets, debt dynamics, then contributions. */
export function applyMonthToBucketState({
  buckets,
  debtBalance,
  bucketRates,
  bucketContributions,
  liabilities = [],
  settings = {},
}) {
  let monthlyReturn = 0;
  const nextBuckets = { ...buckets };

  for (const bucket of GROWTH_BUCKETS) {
    const balance = nextBuckets[bucket] ?? 0;
    if (balance <= 0) continue;
    const ret = round(balance * annualToMonthlyRate(bucketRates[bucket] ?? 0));
    monthlyReturn += ret;
    nextBuckets[bucket] = round(balance + ret);
  }

  const { interest, payments } = computeDebtMonthDelta(
    debtBalance,
    liabilities,
    settings,
  );
  monthlyReturn = round(monthlyReturn - interest);
  let nextDebt = round(Math.max(0, debtBalance + interest - payments));

  for (const bucket of GROWTH_BUCKETS) {
    nextBuckets[bucket] = round(
      (nextBuckets[bucket] ?? 0) + (bucketContributions[bucket] ?? 0),
    );
  }

  return {
    buckets: nextBuckets,
    debtBalance: nextDebt,
    monthlyReturn,
    netWorth: netWorthFromState(nextBuckets, nextDebt),
  };
}

export function getProjectionStartingPatrimony({
  settings,
  assets,
  liabilities,
  snapshots,
  monthKey = getCurrentMonthKey(),
}) {
  const { buckets, debtBalance, fromSnapshots } = buildInitialBucketState({
    settings,
    assets,
    liabilities,
    snapshots,
    initialPatrimony: settings?.initialPatrimony ?? 0,
    monthKey,
  });
  if (fromSnapshots) return netWorthFromState(buckets, debtBalance);
  return settings?.initialPatrimony ?? 0;
}

export function formatBucketRatesForDisplay(settings, bucketRates) {
  return GROWTH_BUCKETS.filter((b) => (bucketRates[b] ?? 0) > 0 || b !== 'real_estate')
    .map((bucket) => ({
      bucket,
      rate: bucketRates[bucket] ?? defaultRateForBucket(settings, bucket),
    }));
}
