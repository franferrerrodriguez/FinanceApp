import { useCallback, useState } from 'react';
import { isAuthAvailable } from '../lib/auth';
import { isSimpleAuthMode } from '../lib/authConfig';
import { persistUserToSupabase } from '../lib/persistUserToSupabase';
import { useAppStore } from '../store/appStore';

/** Manual patrimony save to cloud (no automatic sync). */
export function usePatrimonySave() {
  const userId = useAppStore((s) => s.user?.id);
  const [status, setStatus] = useState('idle');
  const canCloudSave = isAuthAvailable() && !isSimpleAuthMode() && Boolean(userId);

  const saveToCloud = useCallback(async () => {
    if (!canCloudSave) {
      setStatus('saved');
      window.setTimeout(() => setStatus('idle'), 2000);
      return { ok: true };
    }

    setStatus('saving');
    const result = await persistUserToSupabase(userId);
    setStatus(result.ok ? 'saved' : 'error');
    window.setTimeout(() => setStatus('idle'), 2500);
    return result;
  }, [canCloudSave, userId]);

  return { saveToCloud, status, canCloudSave };
}
