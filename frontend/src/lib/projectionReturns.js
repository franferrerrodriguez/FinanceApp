import { DEFAULT_SETTINGS } from './constants.js';
import { getProjectionAnnualRate } from './projectionRates.js';

export const SCENARIO_MULTIPLIERS = {
  pessimistic: 0.25,
  moderate: 1.00,
  optimistic: 1.50,
};

export function applyScenarioMultiplier(annualReturn, scenario) {
  return annualReturn * (SCENARIO_MULTIPLIERS[scenario] ?? 1.00);
}

export function buildScenarioAssets(assets, scenario, settings) {
  if (scenario === 'moderate') return assets;
  return (assets ?? []).map((asset) => ({
    ...asset,
    customAnnualReturn: applyScenarioMultiplier(
      getAssetAnnualReturn(settings, asset),
      scenario,
    ),
  }));
}

/** Suggested annual return when adding an asset (or plan) of this category. */
export function getDefaultReturnForAssetCategory(category, settings = {}) {
  switch (category) {
    case 'cash':
    case 'real_estate':
      return 0;
    case 'bank':
      return DEFAULT_SETTINGS.savingsAccountReturn;
    case 'pension':
      return DEFAULT_SETTINGS.pensionPlanReturn;
    case 'investment':
    case 'etf':
    case 'other':
      return getProjectionAnnualRate(settings);
    default:
      return 0;
  }
}

/** Annual return for an asset/plan category (optional per-line override). */
export function getReturnForCategory(settings, category, customAnnualReturn) {
  if (customAnnualReturn != null && Number.isFinite(customAnnualReturn)) {
    return customAnnualReturn;
  }
  return getDefaultReturnForAssetCategory(category, settings);
}

/** Per-asset return: value set on the asset, else category default. */
export function getAssetAnnualReturn(settings, asset) {
  return getReturnForCategory(
    settings,
    asset?.category,
    asset?.customAnnualReturn,
  );
}

export function getPlanAnnualReturn(settings, plan, assets) {
  const asset = (assets ?? []).find((a) => a.id === plan?.assetId);
  if (asset) return getAssetAnnualReturn(settings, asset);
  return getReturnForCategory(
    settings,
    plan?.category,
    plan?.customAnnualReturn,
  );
}
