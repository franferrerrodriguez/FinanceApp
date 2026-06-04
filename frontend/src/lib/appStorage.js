/**
 * Storage adapter for web and Capacitor.
 * Zustand persist and Supabase use a sync API; on native we mirror Preferences ↔ localStorage.
 */
import { Preferences } from '@capacitor/preferences';
import { isNativeApp } from './platform';

const MIRROR_PREFIX = 'financia_mirror:';

function mirrorKey(key) {
  return `${MIRROR_PREFIX}${key}`;
}

/** Hydrate localStorage from Capacitor Preferences (call once at app start on native). */
export async function hydrateAppStorageFromNative() {
  if (!isNativeApp()) return;

  const { keys } = await Preferences.keys();
  const mirrorKeys = keys.filter((k) => k.startsWith(MIRROR_PREFIX));

  await Promise.all(
    mirrorKeys.map(async (prefKey) => {
      const { value } = await Preferences.get({ key: prefKey });
      if (value == null) return;
      const storageKey = prefKey.slice(MIRROR_PREFIX.length);
      localStorage.setItem(storageKey, value);
    }),
  );
}

function persistToNative(key, value) {
  if (!isNativeApp()) return;
  void Preferences.set({ key: mirrorKey(key), value });
}

function removeFromNative(key) {
  if (!isNativeApp()) return;
  void Preferences.remove({ key: mirrorKey(key) });
}

/** Sync storage compatible with zustand createJSONStorage. */
export const appStorage = {
  getItem(name) {
    return localStorage.getItem(name);
  },
  setItem(name, value) {
    localStorage.setItem(name, value);
    persistToNative(name, value);
  },
  removeItem(name) {
    localStorage.removeItem(name);
    removeFromNative(name);
  },
};
