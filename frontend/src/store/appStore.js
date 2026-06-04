import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_SETTINGS } from '../lib/constants';
import {
  onRehydrateProjectionYears,
  persistOptions,
} from './persistConfig';
import { createFinanceSlice } from './slices/financeSlice';
import { createOnboardingSlice } from './slices/onboardingSlice';
import { createPreferencesSlice } from './slices/preferencesSlice';
import { createSessionSlice } from './slices/sessionSlice';

/**
 * Store global de la app (Zustand).
 * - Estado en memoria: fuente de verdad para React.
 * - persist + localStorage: sincronización automática al cambiar el estado.
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
          annualExpenses: [],
          salaryHistory: [],
          assets: [],
          liabilities: [],
          snapshots: [],
        }),
    }),
    {
      ...persistOptions,
      onRehydrateStorage: () => (state) => {
        const next = onRehydrateProjectionYears(state);
        if (next && next !== state) {
          useAppStore.setState({ settings: next.settings });
        }
      },
    },
  ),
);
