/**
 * Local accounts: email + password (PBKDF2 hash in localStorage).
 * No emails, no OAuth, no service_role. Financial data stays on this device.
 */

const ACCOUNTS_KEY = 'financia_auth_accounts_v1';
const SESSION_KEY = 'financia_auth_session_v1';
const PBKDF2_ITERATIONS = 120_000;

function getAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function bytesToB64(bytes) {
  const bin = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
  return btoa(bin);
}

function b64ToBytes(b64) {
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hashPassword(password, saltB64) {
  const enc = new TextEncoder();
  const salt = b64ToBytes(saltB64);
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  );
  return bytesToB64(new Uint8Array(bits));
}

export function getStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(user) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ id: user.id, email: user.email }),
  );
}

export function clearSimpleAuthSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function registerSimpleAccount({ email, password }) {
  const normalized = email.trim().toLowerCase();
  if (!normalized || password.length < 6) {
    return { ok: false, errorCode: 'required' };
  }

  const accounts = getAccounts();
  if (accounts.some((a) => a.email === normalized)) {
    return { ok: false, errorCode: 'alreadyRegistered' };
  }

  const salt = bytesToB64(crypto.getRandomValues(new Uint8Array(16)));
  const passwordHash = await hashPassword(password, salt);
  const user = {
    id: crypto.randomUUID(),
    email: normalized,
    salt,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  accounts.push(user);
  saveAccounts(accounts);

  const sessionUser = { id: user.id, email: user.email };
  saveSession(sessionUser);

  return {
    ok: true,
    user: sessionUser,
    needsEmailConfirmation: false,
    sync: { success: true, skipped: true },
  };
}

export async function loginSimpleAccount({ email, password }) {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) {
    return { ok: false, errorCode: 'required' };
  }

  const account = getAccounts().find((a) => a.email === normalized);
  if (!account) {
    return { ok: false, errorCode: 'invalidCredentials' };
  }

  const hash = await hashPassword(password, account.salt);
  if (hash !== account.passwordHash) {
    return { ok: false, errorCode: 'invalidCredentials' };
  }

  const sessionUser = { id: account.id, email: account.email };
  saveSession(sessionUser);

  return {
    ok: true,
    user: sessionUser,
    sync: { success: true, skipped: true },
  };
}

export function restoreSimpleSession() {
  const session = getStoredSession();
  if (!session?.id) return null;

  const account = getAccounts().find((a) => a.id === session.id);
  if (!account) {
    clearSimpleAuthSession();
    return null;
  }

  return { id: account.id, email: account.email };
}
