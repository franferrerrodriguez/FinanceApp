import { useEffect } from 'react';
import { fetchIneIpcBundle } from '../lib/ineInflation';
import { useAppStore } from '../store/appStore';

/** Keeps projection inflation aligned with the latest INE IPC (cached 24h). */
export function useIneInflationSync() {
  useEffect(() => {
    let cancelled = false;

    fetchIneIpcBundle()
      .then((bundle) => {
        if (cancelled || bundle.latest?.rate == null) return;
        useAppStore.getState().setSettings({
          expectedInflation: bundle.latest.rate,
        });
      })
      .catch(() => {
        /* offline / INE error: keep persisted value */
      });

    return () => {
      cancelled = true;
    };
  }, []);
}
