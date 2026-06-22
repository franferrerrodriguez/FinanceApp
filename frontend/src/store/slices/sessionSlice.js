import { SAVE_BANNER_SNOOZE_MS } from '../../lib/constants';

/** Session, auth, and usage metadata (not all fields are persisted). */
export const createSessionSlice = (set) => ({
  user: null,
  profile: null,
  sessionStatus: 'guest_no_data',
  /** idle | syncing | ready | error — load from Supabase after auth */
  cloudSyncStatus: 'idle',
  /** false until Supabase session in localStorage has been read */
  authBootstrapped: false,
  /** Timestamp (ms): hide register prompt until this date. */
  saveBannerSnoozedUntil: null,
  activeMinutes: 0,

  setUser: (user) =>
    set({ user, sessionStatus: 'authenticated' }),

  setProfile: (profile) =>
    set((state) => ({
      profile: { ...state.profile, ...profile },
    })),

  snoozeSaveBanner: () =>
    set({ saveBannerSnoozedUntil: Date.now() + SAVE_BANNER_SNOOZE_MS }),

  incrementActiveMinutes: () =>
    set((state) => ({ activeMinutes: state.activeMinutes + 1 })),
});
