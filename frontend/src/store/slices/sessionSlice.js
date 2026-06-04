import { SAVE_BANNER_SNOOZE_MS } from '../../lib/constants';

/** Sesión, auth y metadatos de uso (no todos se persisten). */
export const createSessionSlice = (set, get) => ({
  user: null,
  profile: null,
  sessionStatus: 'guest_no_data',
  /** Timestamp (ms): no mostrar aviso de registro hasta esta fecha. */
  saveBannerSnoozedUntil: null,
  activeMinutes: 0,

  setUser: (user) =>
    set({ user, sessionStatus: 'authenticated' }),

  setProfile: (profile) =>
    set((state) => ({
      profile: { ...state.profile, ...profile },
    })),

  logout: () =>
    set({
      user: null,
      sessionStatus: get().onboardingCompleted
        ? 'guest_with_data'
        : 'guest_no_data',
    }),

  snoozeSaveBanner: () =>
    set({ saveBannerSnoozedUntil: Date.now() + SAVE_BANNER_SNOOZE_MS }),

  incrementActiveMinutes: () =>
    set((state) => ({ activeMinutes: state.activeMinutes + 1 })),
});
