import { annualToMonthlyRate } from './calculations.js';
import { getCurrentMonthKey } from './dashboardMetrics.js';
import { roundMoney, sumEuros } from './money.js';
import { resolveContributionsForMonth } from './contributionPlans.js';
import {
  getSnapshotAssetId,
  getSnapshotLiabilityId,
  groupSnapshotsByMonth,
} from './snapshotUtils.js';
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
  return roundMoney(sumBucketBalances(buckets) - Math.max(0, debtBalance));
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
        buckets[bucket] = roundMoney((buckets[bucket] ?? 0) + Math.max(0, value));
      } else if (liabilityId) {
        const liability = (liabilities ?? []).find((l) => l.id === liabilityId);
        if (liability?.isActive !== false) {
          debtBalance = roundMoney(debtBalance + Math.abs(value));
        }
      }
    }
  } else if ((initialPatrimony ?? 0) > 0) {
    buckets.investment = roundMoney(initialPatrimony);
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

export function splitContributionBreakdownToBuckets(breakdown = [], netContribution = 0) {
  const bucketContrib = createEmptyBuckets();
  const total = sumEuros(...breakdown.map((item) => item.amount ?? 0));
  const freeSavings = roundMoney(Math.max(0, netContribution - total));
  bucketContrib.liquid += freeSavings;

  for (const item of breakdown) {
    if ((item.amount ?? 0) <= 0) continue;
    const bucket = planCategoryToBucket(item.category);
    bucketContrib[bucket] = roundMoney(bucketContrib[bucket] + item.amount);
  }

  return bucketContrib;
}

export function splitContributionsToBuckets(
  plans,
  monthIndex,
  netContribution,
  monthKey,
) {
  const { breakdown } = resolveContributionsForMonth(
    plans,
    monthIndex,
    monthKey,
  );
  return splitContributionBreakdownToBuckets(breakdown, netContribution);
}

/** One projection month: returns, contributions, then optional mortgage amortization. */
export function applyMonthToBucketState({
  buckets,
  debtBalance,
  bucketRates,
  bucketContributions,
  mortgageMonth = null,
}) {
  let monthlyReturn = 0;
  const nextBuckets = { ...buckets };

  for (const bucket of GROWTH_BUCKETS) {
    const balance = nextBuckets[bucket] ?? 0;
    if (balance <= 0) continue;
    const ret = roundMoney(balance * annualToMonthlyRate(bucketRates[bucket] ?? 0));
    monthlyReturn += ret;
    nextBuckets[bucket] = roundMoney(balance + ret);
  }

  for (const bucket of GROWTH_BUCKETS) {
    nextBuckets[bucket] = roundMoney(
      (nextBuckets[bucket] ?? 0) + (bucketContributions[bucket] ?? 0),
    );
  }

  let nextDebt = debtBalance;
  let mortgagePayment = 0;
  let mortgageInterest = 0;
  let mortgagePrincipal = 0;

  if (mortgageMonth && (mortgageMonth.mortgagePayment ?? 0) > 0) {
    mortgagePayment = mortgageMonth.mortgagePayment;
    mortgageInterest = mortgageMonth.mortgageInterest;
    mortgagePrincipal = mortgageMonth.mortgagePrincipal;
    nextDebt = mortgageMonth.debtBalanceEnd;
    nextBuckets.liquid = roundMoney(
      Math.max(0, (nextBuckets.liquid ?? 0) - mortgagePayment),
    );
  }

  return {
    buckets: nextBuckets,
    debtBalance: nextDebt,
    monthlyReturn,
    grossAssets: sumBucketBalances(nextBuckets),
    netWorth: netWorthFromState(nextBuckets, nextDebt),
    mortgagePayment,
    mortgageInterest,
    mortgagePrincipal,
  };
}

export function getProjectionStartingState({
  settings,
  assets,
  liabilities,
  snapshots,
  monthKey = getCurrentMonthKey(),
}) {
  const { buckets, debtBalance, bucketRates, fromSnapshots } = buildInitialBucketState({
    settings,
    assets,
    liabilities,
    snapshots,
    initialPatrimony: settings?.initialPatrimony ?? 0,
    monthKey,
  });
  const grossAssets = sumBucketBalances(buckets);
  const netWorth = netWorthFromState(buckets, debtBalance);
  return {
    buckets,
    debtBalance,
    bucketRates,
    fromSnapshots,
    grossAssets,
    netWorth,
  };
}

export function getProjectionStartingPatrimony(params) {
  const state = getProjectionStartingState(params);
  if (state.fromSnapshots) return state.netWorth;
  return params.settings?.initialPatrimony ?? 0;
}

export function formatBucketRatesForDisplay(settings, bucketRates) {
  return GROWTH_BUCKETS.filter((b) => (bucketRates[b] ?? 0) > 0 || b !== 'real_estate')
    .map((bucket) => ({
      bucket,
      rate: bucketRates[bucket] ?? defaultRateForBucket(settings, bucket),
    }));
}
