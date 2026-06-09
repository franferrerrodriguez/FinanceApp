import { isAuthAvailable } from './auth.js';
import { isSimpleAuthMode } from './authConfig.js';
import { persistUserToSupabase } from './persistUserToSupabase.js';
import { supabaseConfigured } from './supabase.js';
import { useAppStore } from '../store/appStore.js';

export const CLOUD_SYNC_DEBOUNCE_MS = 2500;
export const CLOUD_SYNC_PAUSE_AFTER_PULL_MS = 4000;

const SYNC_WATCH_KEYS = [
  'settings',
  'annualExpenses',
  'cashflowHistory',
  'contributionPlans',
  'assets',
  'liabilities',
  'snapshots',
  'profile',
  'onboardingCompleted',
];

let debounceTimer = null;
let syncPausedUntil = 0;
let uploadInFlight = null;

export function isCloudAutoSyncAvailable() {
  return isAuthAvailable() && !isSimpleAuthMode() && supabaseConfigured;
}

export function pauseCloudAutoSync(ms = CLOUD_SYNC_PAUSE_AFTER_PULL_MS) {
  syncPausedUntil = Date.now() + ms;
}

export function getCloudSyncFingerprint(state) {
  const slice = {};
  for (const key of SYNC_WATCH_KEYS) {
    slice[key] = state?.[key];
  }
  return JSON.stringify(slice);
}

export function canCloudAutoSync(state = useAppStore.getState()) {
  if (!isCloudAutoSyncAvailable()) return false;
  if (state.sessionStatus !== 'authenticated' || !state.user?.id) return false;
  if (!state.authBootstrapped) return false;
  if (state.cloudSyncStatus === 'syncing') return false;
  if (Date.now() < syncPausedUntil) return false;
  return true;
}

export function scheduleCloudAutoSync() {
  if (!canCloudAutoSync()) return;

  if (debounceTimer != null) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void flushCloudAutoSync();
  }, CLOUD_SYNC_DEBOUNCE_MS);
}

export async function flushCloudAutoSync() {
  if (debounceTimer != null) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  if (!canCloudAutoSync()) {
    return { ok: false, skipped: true };
  }

  const userId = useAppStore.getState().user.id;
  if (uploadInFlight?.userId === userId) {
    return uploadInFlight.promise;
  }

  const promise = (async () => {
    useAppStore.setState({ cloudSyncStatus: 'syncing' });
    const result = await persistUserToSupabase(userId);
    if (result.ok) {
      useAppStore.setState({ cloudSyncStatus: 'ready' });
    }
    return result;
  })();

  uploadInFlight = { userId, promise };
  try {
    return await promise;
  } finally {
    if (uploadInFlight?.userId === userId) {
      uploadInFlight = null;
    }
  }
}

export function clearCloudAutoSyncTimers() {
  if (debounceTimer != null) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}
