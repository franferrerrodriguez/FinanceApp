import { useEffect } from 'react';
import {
  canCloudAutoSync,
  clearCloudAutoSyncTimers,
  flushCloudAutoSync,
  getCloudSyncFingerprint,
  isCloudAutoSyncAvailable,
  scheduleCloudAutoSync,
} from '../lib/cloudSync';
import { useAppStore } from '../store/appStore';

/**
 * Debounced upload to Supabase when finance data changes (authenticated users).
 * Flushes pending changes when the tab goes to background.
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
      }
    };

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      unsub();
      document.removeEventListener('visibilitychange', onVisibility);
      clearCloudAutoSyncTimers();
    };
  }, [authBootstrapped, sessionStatus, userId]);
}
