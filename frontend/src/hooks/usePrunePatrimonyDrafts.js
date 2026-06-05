import { useEffect } from 'react';
import { isDraftAsset, isDraftLiability } from '../lib/patrimonyDrafts';
import { useAppStore } from '../store/appStore';

/** Removes ghost placeholder assets/liabilities left from accidental saves. */
export function usePrunePatrimonyDrafts(assets = [], liabilities = []) {
  const removeAsset = useAppStore((s) => s.removeAsset);
  const removeLiability = useAppStore((s) => s.removeLiability);

  useEffect(() => {
    assets.filter(isDraftAsset).forEach((a) => removeAsset(a.id));
  }, [assets, removeAsset]);

  useEffect(() => {
    liabilities.filter(isDraftLiability).forEach((l) => removeLiability(l.id));
  }, [liabilities, removeLiability]);
}
