import assert from 'node:assert/strict';
import {
  formatContributionGrowthLabel,
  isSavableContributionPlan,
} from './contributionPlanLabels.js';
import { createAsset } from './patrimony.js';

const t = (key, vars) => {
  if (key === 'balance.contributions.growthFixed') return 'Fijo';
  if (key === 'balance.contributions.tableGrowthRamp') return `+${vars.amount}/mes`;
  if (key === 'balance.contributions.tableGrowthAnnual') return `+${vars.rate}/año`;
  return key;
};

const formatMoney = (n) => `${n}€`;
const formatPercent = (n) => `${Math.round(n * 100)}%`;

assert.equal(
  formatContributionGrowthLabel({ growthMode: 'fixed' }, t, formatMoney, formatPercent),
  'Fijo',
);

const fund = createAsset({ id: 'f1', category: 'investment', name: 'Indexa' });
assert.equal(
  isSavableContributionPlan({ assetId: 'f1' }, [fund]),
  true,
);
assert.equal(isSavableContributionPlan({ assetId: null }, [fund]), false);

console.log('contributionPlanLabels.test.js: ok');
