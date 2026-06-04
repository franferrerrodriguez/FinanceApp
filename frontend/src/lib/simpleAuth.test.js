import assert from 'node:assert/strict';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => {
    store.set(k, String(v));
  },
  removeItem: (k) => {
    store.delete(k);
  },
};

const {
  clearSimpleAuthSession,
  loginSimpleAccount,
  registerSimpleAccount,
  restoreSimpleSession,
} = await import('./simpleAuth.js');

const ACCOUNTS_KEY = 'financia_auth_accounts_v1';
const SESSION_KEY = 'financia_auth_session_v1';

function reset() {
  store.clear();
  clearSimpleAuthSession();
}

reset();

const reg = await registerSimpleAccount({
  email: 'test@example.com',
  password: 'secret12',
});
assert.equal(reg.ok, true);
assert.equal(reg.user.email, 'test@example.com');

clearSimpleAuthSession();
assert.equal(restoreSimpleSession(), null);

const login = await loginSimpleAccount({
  email: 'test@example.com',
  password: 'secret12',
});
assert.equal(login.ok, true);
assert.equal(restoreSimpleSession()?.email, 'test@example.com');

reset();
await registerSimpleAccount({
  email: 'dup@example.com',
  password: 'secret12',
});

const dup = await registerSimpleAccount({
  email: 'dup@example.com',
  password: 'other123',
});
assert.equal(dup.ok, false);
assert.equal(dup.errorCode, 'alreadyRegistered');

const bad = await loginSimpleAccount({
  email: 'dup@example.com',
  password: 'wrongpass',
});
assert.equal(bad.ok, false);
assert.equal(bad.errorCode, 'invalidCredentials');

store.delete(ACCOUNTS_KEY);
store.delete(SESSION_KEY);

console.log('simpleAuth.test.js: ok');
