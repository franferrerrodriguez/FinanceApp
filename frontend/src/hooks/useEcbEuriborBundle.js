import { useEffect, useState } from 'react';
import {
  fetchEcbEuriborBundle,
  getCachedEcbEuriborHistory,
  getCachedEcbEuriborLatest,
} from '../lib/ecbEuribor';

export function useEcbEuriborBundle() {
  const [state, setState] = useState(() => ({
    status: getCachedEcbEuriborLatest() ? 'ready' : 'loading',
    latest: getCachedEcbEuriborLatest(),
    history: getCachedEcbEuriborHistory(),
  }));

  useEffect(() => {
    let cancelled = false;

    fetchEcbEuriborBundle()
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
            status: getCachedEcbEuriborLatest() ? 'ready' : 'error',
          }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
