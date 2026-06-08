import {
  createContributionEntry,
  getEntriesForMonth,
  getMonthKeysFromEntries,
  getTotalForMonth,
  hasContributionEntries,
  hasEntriesInMonth,
  resolveEntriesForMonth,
} from './contributionEntries.js';
import {
  resolveContributionsForProjectionMonth,
  resolveInvestmentContributionsForProjectionMonth,
} from './contributionProjection.js';

const assets = [
  { id: 'a1', name: 'Indexa', category: 'investment', isActive: true },
  { id: 'a2', name: 'Banco', category: 'bank', isActive: true },
];

const entries = [
  createContributionEntry({ id: 'e1', assetId: 'a1', date: '2026-06-10', amount: 200 }),
  createContributionEntry({ id: 'e2', assetId: 'a1', date: '2026-06-20', amount: 200 }),
  createContributionEntry({ id: 'e3', assetId: 'a2', date: '2026-05-15', amount: 100 }),
];

console.assert(getEntriesForMonth(entries, '2026-06').length === 2, 'two entries in june');
console.assert(getTotalForMonth(entries, '2026-06', assets) === 400, 'june total 400');
console.assert(
  resolveEntriesForMonth(entries, '2026-06', assets).breakdown.length === 1,
  'one asset in june breakdown',
);
console.assert(
  resolveEntriesForMonth(entries, '2026-06', assets).breakdown[0].amount === 400,
  'indexa 400 in june',
);
console.assert(hasContributionEntries(entries), 'has entries');
console.assert(hasEntriesInMonth(entries, '2026-06'), 'has june entries');
console.assert(getMonthKeysFromEntries(entries)[0] === '2026-06', 'latest month first');

const projected = resolveContributionsForProjectionMonth({
  entries,
  contributionPlans: [],
  assets,
  settings: {},
  monthKey: '2026-07',
  monthIndex: 1,
});
console.assert(projected.source === 'history', 'july uses history');
console.assert(projected.total > 0, 'july projected total > 0');

const actualMonth = resolveContributionsForProjectionMonth({
  entries,
  contributionPlans: [],
  assets,
  settings: {},
  monthKey: '2026-06',
  monthIndex: 0,
});
console.assert(actualMonth.source === 'actual', 'june uses actual');
console.assert(actualMonth.total === 400, 'june actual 400');

const invest = resolveInvestmentContributionsForProjectionMonth({
  entries,
  contributionPlans: [],
  assets,
  settings: {},
  monthKey: '2026-06',
  monthIndex: 0,
});
console.assert(invest === 400, 'investment filter');

console.log('contributionEntries.test.js: ok');
