import { useEffect, useRef } from 'react';
import { isDraftAsset, isDraftLiability } from '../lib/patrimonyDrafts';
import { useAppStore } from '../store/appStore';

/** Removes ghost placeholder assets/liabilities left from accidental saves. */
export function usePrunePatrimonyDrafts() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const state = useAppStore.getState();
    const draftAssets = state.assets.filter(isDraftAsset);
    const draftLiabilities = state.liabilities.filter(isDraftLiability);

    draftAssets.forEach((a) => state.removeAsset(a.id));
    draftLiabilities.forEach((l) => state.removeLiability(l.id));
  }, []);
}
