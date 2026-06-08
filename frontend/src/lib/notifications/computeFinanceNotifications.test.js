import assert from 'node:assert/strict';
import {
  computeFinanceNotifications,
  getNotificationSources,
  registerNotificationSource,
} from './index.js';

const baseSettings = {
  monthlyNetSalary: 2500,
  otherMonthlyIncome: 0,
  mortgageRent: 500,
  householdFixedEstimate: 0,
  leisureEstimate: 200,
  emergencyFundMonths: 6,
};

const result = computeFinanceNotifications({
  settings: baseSettings,
  assets: [],
  liabilities: [],
  snapshots: [],
  contributionEntries: [],
});

assert.ok(getNotificationSources().length >= 2);
assert.equal(result.badgeCount, 1);
assert.equal(result.bellItems[0].id, 'balance_setup');
assert.equal(result.bellItems[0].href, '/dashboard');
assert.equal(result.setup.hasPending, true);
assert.equal(result.alerts.length, 0);

const done = computeFinanceNotifications({
  settings: baseSettings,
  assets: [
    {
      id: 'b1',
      name: 'Cuenta',
      category: 'bank',
      provider: 'bankinter',
      isActive: true,
    },
  ],
  snapshots: [
    { id: 's1', assetId: 'b1', snapshotDate: '2026-06-04', value: 5000 },
  ],
  contributionEntries: [],
});

assert.equal(done.setup.allComplete, true);
assert.equal(done.badgeCount, 0);

let pluginCalled = false;
registerNotificationSource({
  id: 'test_plugin',
  collect: () => {
    pluginCalled = true;
    return [
      {
        id: 'test_notice',
        source: 'test_plugin',
        severity: 'info',
        countsInBadge: true,
        showInBell: true,
        messageKey: 'notifications.test',
      },
    ];
  },
});

const withPlugin = computeFinanceNotifications({
  settings: baseSettings,
  assets: [],
  snapshots: [],
});
assert.ok(pluginCalled);
assert.ok(withPlugin.items.some((i) => i.id === 'test_notice'));

console.log('computeFinanceNotifications.test.js: ok');
