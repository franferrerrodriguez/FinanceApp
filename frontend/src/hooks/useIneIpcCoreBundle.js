import { useEffect, useState } from 'react';
import {
  fetchIneIpcCoreBundle,
  getCachedIneIpcCoreHistory,
  getCachedIneIpcCoreLatest,
} from '../lib/ineCoreInflation';

export function useIneIpcCoreBundle() {
  const [state, setState] = useState(() => ({
    status: getCachedIneIpcCoreLatest() ? 'ready' : 'loading',
    latest: getCachedIneIpcCoreLatest(),
    history: getCachedIneIpcCoreHistory(),
  }));

  useEffect(() => {
    let cancelled = false;

    fetchIneIpcCoreBundle()
      .then((bundle) => {
        if (cancelled) return;
        setState({
          status: 'ready',
          latest: bundle.latest,
          history: bundle.history ?? [],
        });
      })
      .catch(() => {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            status: getCachedIneIpcCoreLatest() ? 'ready' : 'error',
          }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
