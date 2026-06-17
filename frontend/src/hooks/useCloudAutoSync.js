import { useEffect } from 'react';
import {
  canCloudAutoSync,
  clearCloudAutoSyncTimers,
  flushCloudAutoSync,
  getCloudSyncFingerprint,
  isCloudAutoSyncAvailable,
  scheduleCloudAutoSync,
} from '../lib/cloudSync';
import { loadUserDataFromSupabase } from '../lib/loadUserDataFromSupabase';
import { useAppStore } from '../store/appStore';

const VISIBILITY_PULL_COOLDOWN_MS = 60_000;
let lastVisibilityPullAt = 0;

/**
 * Debounced upload to Supabase when finance data changes (authenticated users).
 * Flushes pending uploads when the tab goes to background.
 * Pulls fresh cloud data when the tab becomes visible (cross-device sync).
 */
export function useCloudAutoSync() {
  const authBootstrapped = useAppStore((s) => s.authBootstrapped);
  const sessionStatus = useAppStore((s) => s.sessionStatus);
  const userId = useAppStore((s) => s.user?.id);

  useEffect(() => {
    if (!isCloudAutoSyncAvailable() || !authBootstrapped) {
      return undefined;
    }

    let fingerprint = getCloudSyncFingerprint(useAppStore.getState());

    const unsub = useAppStore.subscribe((state) => {
      if (!canCloudAutoSync(state)) return;
      const next = getCloudSyncFingerprint(state);
      if (next === fingerprint) return;
      fingerprint = next;
      scheduleCloudAutoSync();
    });

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        void flushCloudAutoSync();
        return;
      }
      // Pull fresh data from cloud when tab becomes visible (cross-device sync)
      const now = Date.now();
      if (now - lastVisibilityPullAt < VISIBILITY_PULL_COOLDOWN_MS) return;
      const state = useAppStore.getState();
      if (!canCloudAutoSync(state)) return;
      lastVisibilityPullAt = now;
      void loadUserDataFromSupabase(state.user.id);
    };

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      unsub();
      document.removeEventListener('visibilitychange', onVisibility);
      clearCloudAutoSyncTimers();
    };
  }, [authBootstrapped, sessionStatus, userId]);
}
