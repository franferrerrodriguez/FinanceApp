import { useEffect, useState } from 'react';
import {
  fetchIneIpcBundle,
  getCachedIneIpcAnnual,
  getCachedIneIpcHistory,
} from '../lib/ineInflation';
import { useAppStore } from '../store/appStore';

export function useIneIpcBundle() {
  const [state, setState] = useState(() => ({
    status: getCachedIneIpcAnnual() ? 'ready' : 'loading',
    latest: getCachedIneIpcAnnual(),
    history: getCachedIneIpcHistory(),
  }));

  useEffect(() => {
    let cancelled = false;

    fetchIneIpcBundle()
      .then((bundle) => {
        if (cancelled) return;
        setState({
          status: 'ready',
          latest: bundle.latest,
          history: bundle.history ?? [],
        });
        if (bundle.latest?.rate != null) {
          useAppStore.getState().setSettings({
            expectedInflation: bundle.latest.rate,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            status: getCachedIneIpcAnnual() ? 'ready' : 'error',
          }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
