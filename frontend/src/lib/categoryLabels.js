import { ASSET_CATEGORY_VALUES, LIABILITY_CATEGORY_VALUES } from './constants';

export function getAssetCategories(t) {
  return ASSET_CATEGORY_VALUES.map((value) => ({
    value,
    label: t(`categories.asset.${value}`),
  }));
}

export function getLiabilityCategories(t) {
  return LIABILITY_CATEGORY_VALUES.map((value) => ({
    value,
    label: t(`categories.liability.${value}`),
  }));
}

export function getProjectionScenarioLabel(t, key) {
  return t(`scenarios.${key}`);
}
