import { useEffect, useState } from 'react';
import {
  fetchEcbDepositRateBundle,
  getCachedEcbDepositRateHistory,
  getCachedEcbDepositRateLatest,
} from '../lib/ecbDepositRate';

export function useEcbDepositRateBundle() {
  const [state, setState] = useState(() => ({
    status: getCachedEcbDepositRateLatest() ? 'ready' : 'loading',
    latest: getCachedEcbDepositRateLatest(),
    history: getCachedEcbDepositRateHistory(),
  }));

  useEffect(() => {
    let cancelled = false;

    fetchEcbDepositRateBundle()
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
            status: getCachedEcbDepositRateLatest() ? 'ready' : 'error',
          }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
