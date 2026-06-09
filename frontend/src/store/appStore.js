import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { appStorage } from '../lib/appStorage';
import { DEFAULT_SETTINGS } from '../lib/constants';
import {
  onRehydrateOnboardingState,
  onRehydrateProjectionYears,
  persistOptions,
} from './persistConfig';
import { createFinanceSlice } from './slices/financeSlice';
import { createOnboardingSlice } from './slices/onboardingSlice';
import { createPreferencesSlice } from './slices/preferencesSlice';
import { createSessionSlice } from './slices/sessionSlice';

/**
 * Global app store (Zustand).
 * - In-memory state: source of truth for React.
 * - persist + appStorage (localStorage; mirrored to Preferences on native).
 */
export const useAppStore = create(
  persist(
    (set, get) => ({
      ...createSessionSlice(set, get),
      ...createPreferencesSlice(set, get),
      ...createOnboardingSlice(set, get),
      ...createFinanceSlice(set, get),

      resetApp: () =>
        set({
          user: null,
          profile: null,
          sessionStatus: 'guest_no_data',
          onboardingCompleted: false,
          onboardingStep: 0,
          saveBannerSnoozedUntil: null,
          activeMinutes: 0,
          locale: 'es',
          theme: 'system',
          settings: { ...DEFAULT_SETTINGS },
          contributionPlans: [],
      contributionEntries: [],
          annualExpenses: [],
          cashflowHistory: [],
          assets: [],
          liabilities: [],
          snapshots: [],
        }),
    }),
    {
      ...persistOptions,
      storage: createJSONStorage(() => appStorage),
      onRehydrateStorage: () => (state) => {
        let next = onRehydrateOnboardingState(state);
        next = onRehydrateProjectionYears(next ?? state);
        if (!next || next === state) return;

        const patch = {};
        if (next.settings !== state?.settings) patch.settings = next.settings;
        if (next.onboardingStep !== state?.onboardingStep) {
          patch.onboardingStep = next.onboardingStep;
        }
        if (Object.keys(patch).length > 0) {
          useAppStore.setState(patch);
        }
      },
    },
  ),
);
