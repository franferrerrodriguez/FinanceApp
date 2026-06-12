export const CLOUD_USER_ID_KEY = 'financia_cloud_user_id';
export const PERSIST_STORAGE_KEY = 'financia_app_data';

export function getRememberedCloudUserId() {
  try {
    return localStorage.getItem(CLOUD_USER_ID_KEY);
  } catch {
    return null;
  }
}

export function rememberCloudUserId(userId) {
  try {
    localStorage.setItem(CLOUD_USER_ID_KEY, userId);
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearLocalFinancePersist() {
  try {
    localStorage.removeItem(PERSIST_STORAGE_KEY);
    localStorage.removeItem(CLOUD_USER_ID_KEY);
  } catch {
    /* ignore */
  }
}

export function hasFinancePersistSnapshot() {
  try {
    const raw = localStorage.getItem(PERSIST_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    const state = parsed?.state;
    if (!state || typeof state !== 'object') return false;
    return (
      Boolean(state.onboardingCompleted) ||
      (state.settings?.monthlyNetSalary ?? 0) > 0 ||
      (state.assets?.length ?? 0) > 0 ||
      (state.snapshots?.length ?? 0) > 0
    );
  } catch {
    return false;
  }
}

/** Detect account switch and clear stale local persist for the previous user. */
export function prepareFinanceSessionForUser(userId) {
  const previousUserId = getRememberedCloudUserId();
  const switchedUser = Boolean(previousUserId && previousUserId !== userId);
  if (switchedUser) {
    clearLocalFinancePersist();
  }
  return { switchedUser, previousUserId };
}

/** Same authenticated user with a local snapshot — skip cloud pull on refresh. */
export function shouldSkipCloudPull(userId, { switchedUser, previousUserId } = {}) {
  if (switchedUser) return false;
  if (previousUserId !== userId) return false;
  return hasFinancePersistSnapshot();
}
