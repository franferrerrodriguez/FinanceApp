import assert from 'node:assert/strict';
import {
  hasFinancePersistSnapshot,
  prepareFinanceSessionForUser,
  shouldSkipCloudPull,
} from './financeSession.js';

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => store.get(key) ?? null,
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
};

const userA = '11111111-1111-1111-1111-111111111111';
const userB = '22222222-2222-2222-2222-222222222222';

localStorage.setItem('financia_cloud_user_id', userA);
localStorage.setItem(
  'financia_app_data',
  JSON.stringify({
    state: { onboardingCompleted: true, settings: { monthlyNetSalary: 2000 } },
    version: 20,
  }),
);

assert.equal(hasFinancePersistSnapshot(), true);

const switched = prepareFinanceSessionForUser(userB);
assert.equal(switched.switchedUser, true);
assert.equal(localStorage.getItem('financia_cloud_user_id'), null);
assert.equal(localStorage.getItem('financia_app_data'), null);

localStorage.setItem('financia_cloud_user_id', userA);
localStorage.setItem(
  'financia_app_data',
  JSON.stringify({
    state: { onboardingCompleted: true, settings: { monthlyNetSalary: 2000 } },
    version: 20,
  }),
);

assert.equal(
  shouldSkipCloudPull(userA, { switchedUser: false, previousUserId: userA }),
  true,
);
assert.equal(
  shouldSkipCloudPull(userA, { switchedUser: false, previousUserId: null }),
  false,
);

console.log('financeSession.test.js: ok');
