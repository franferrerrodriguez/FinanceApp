import { DEFAULT_LOCALE } from '../i18n/config';
import { seedPlansFromLegacyInvestment } from '../lib/contributionPlans';
import {
  DEFAULT_SETTINGS,
  PROJECTION_YEARS_DEFAULT,
  SAVE_BANNER_SNOOZE_MS,
  resolveProjectionYearsFromPersist,
} from '../lib/constants';
import { enrichSettingsWithSalary } from '../lib/salary';
import {
  createCashflowEntry,
  createCashflowEntryFromSettings,
  getCurrentMonthKey,
  migrateSalaryHistoryToCashflow,
  syncSettingsFromCashflowHistory,
  upsertCurrentMonthCashflowTramo,
} from '../lib/cashflowHistory';
import { ONBOARDING_STEP_IDS } from '../modules/onboarding/constants';

export const PERSIST_STORAGE_KEY = 'financia_app_data';
export const PERSIST_VERSION = 12;

const MAX_ONBOARDING_STEP = ONBOARDING_STEP_IDS.length - 1;

export function partializePersistedState(state) {
  return {
    onboardingCompleted: state.onboardingCompleted,
    onboardingStep: state.onboardingStep,
    saveBannerSnoozedUntil: state.saveBannerSnoozedUntil,
    locale: state.locale,
    theme: state.theme,
    settings: state.settings,
    annualExpenses: state.annualExpenses,
    cashflowHistory: state.cashflowHistory,
    contributionPlans: state.contributionPlans,
    assets: state.assets,
    liabilities: state.liabilities,
    snapshots: state.snapshots,
    profile: state.profile,
  };
}

export function mergePersistedState(persisted, current) {
  if (!persisted) return current;

  return {
    ...current,
    ...persisted,
    locale: persisted.locale ?? current.locale,
    theme: persisted.theme ?? current.theme,
    settings: {
      ...DEFAULT_SETTINGS,
      ...persisted.settings,
      projectionYears: resolveProjectionYearsFromPersist(
        persisted.settings?.projectionYears,
      ),
    },
    annualExpenses: persisted.annualExpenses ?? current.annualExpenses ?? [],
    cashflowHistory:
      persisted.cashflowHistory ??
      current.cashflowHistory ??
      [],
    contributionPlans:
      persisted.contributionPlans ?? current.contributionPlans ?? [],
    assets: persisted.assets ?? current.assets,
    liabilities: persisted.liabilities ?? current.liabilities,
    snapshots: persisted.snapshots ?? current.snapshots,
    profile: persisted.profile ?? current.profile,
    onboardingStep: Math.min(
      persisted.onboardingStep ?? 0,
      MAX_ONBOARDING_STEP,
    ),
  };
}

export function migratePersistedState(persisted, version) {
  if (!persisted) return persisted;

  const next = { ...persisted };

  if (version < 2) {
    next.onboardingStep = Math.min(
      next.onboardingStep ?? 0,
      MAX_ONBOARDING_STEP,
    );
  }

  if (version < 3) {
    next.locale = next.locale ?? DEFAULT_LOCALE;
    next.theme = next.theme ?? 'system';
  }

  if (version < 4) {
    const settings = { ...DEFAULT_SETTINGS, ...next.settings };
    if (!next.contributionPlans?.length) {
      next.contributionPlans = seedPlansFromLegacyInvestment(settings);
    }
  }

  if (version < 5 && next.settings) {
    next.settings = { ...next.settings, useRealReturn: true };
  }

  if (version < 6) {
    next.annualExpenses = next.annualExpenses ?? [];
    if (next.settings) {
      next.settings = enrichSettingsWithSalary(
        {
          salaryPaysPreset: next.settings.salaryPaysPreset ?? '12',
          numPagas: next.settings.numPagas ?? 12,
          emergencyFundMonths: next.settings.emergencyFundMonths ?? 6,
        },
        { ...DEFAULT_SETTINGS, ...next.settings },
      );
    }
  }

  if (version < 7 && next.settings) {
    next.settings = {
      ...next.settings,
      projectionYears: PROJECTION_YEARS_DEFAULT,
    };
  }

  if (version < 8 && next.settings) {
    const y = Number(next.settings.projectionYears);
    if (!Number.isFinite(y) || y < 1 || y <= 2) {
      next.settings = {
        ...next.settings,
        projectionYears: PROJECTION_YEARS_DEFAULT,
      };
    }
  }

  if (version < 9) {
    next.saveBannerSnoozedUntil = next.bannerDismissed
      ? Date.now() + SAVE_BANNER_SNOOZE_MS
      : null;
    delete next.bannerDismissed;
  }

  if (version < 10) {
    next.salaryHistory = next.salaryHistory ?? [];
    const settings = { ...DEFAULT_SETTINGS, ...next.settings };
    if (
      !next.salaryHistory.length &&
      (settings.monthlyNetSalary ?? 0) > 0
    ) {
      next.salaryHistory = [
        createCashflowEntryFromSettings(settings, '2020-01'),
      ];
    }
    if (next.settings) {
      next.settings = { ...settings, annualSalaryIncrease: 0 };
    }
  }

  if (version < 11) {
    let salaryHistory = next.salaryHistory ?? [];
    let settings = enrichSettingsWithSalary(
      {},
      { ...DEFAULT_SETTINGS, ...next.settings },
    );

    if (!salaryHistory.length) {
      salaryHistory =
        (settings.monthlyNetSalary ?? 0) > 0
          ? [
              createCashflowEntryFromSettings(
                settings,
                getCurrentMonthKey(),
              ),
            ]
          : [
              createCashflowEntry(
                { effectiveFrom: getCurrentMonthKey() },
                settings,
              ),
            ];
    } else {
      salaryHistory = upsertCurrentMonthCashflowTramo(settings, salaryHistory);
    }

    settings = syncSettingsFromCashflowHistory(settings, salaryHistory);
    next.salaryHistory = salaryHistory;
    next.settings = settings;
  }

  if (version < 12) {
    let cashflowHistory =
      next.cashflowHistory ??
      migrateSalaryHistoryToCashflow(next.salaryHistory, {
        ...DEFAULT_SETTINGS,
        ...next.settings,
      });

    let settings = enrichSettingsWithSalary(
      {},
      { ...DEFAULT_SETTINGS, ...next.settings },
    );

    if (!cashflowHistory.length) {
      cashflowHistory =
        (settings.monthlyNetSalary ?? 0) > 0 ||
        calcHasAnyExpense(settings)
          ? [createCashflowEntryFromSettings(settings, getCurrentMonthKey())]
          : [createCashflowEntry({ effectiveFrom: getCurrentMonthKey() }, settings)];
    } else {
      cashflowHistory = upsertCurrentMonthCashflowTramo(settings, cashflowHistory);
    }

    settings = syncSettingsFromCashflowHistory(settings, cashflowHistory);
    next.cashflowHistory = cashflowHistory;
    next.settings = settings;
    delete next.salaryHistory;
  }

  return next;
}

function calcHasAnyExpense(settings) {
  return (
    (settings.mortgageRent ?? 0) > 0 ||
    (settings.mortgageRentTotal ?? 0) > 0 ||
    (settings.householdFixedEstimate ?? 0) > 0 ||
    (settings.leisureEstimate ?? 0) > 0 ||
    (settings.groceriesEstimate ?? 0) > 0
  );
}

/** After rehydrate, ensure horizon ≥ 20 if a legacy value remained in memory. */
export function onRehydrateProjectionYears(state) {
  if (!state?.settings) return state;
  const resolved = resolveProjectionYearsFromPersist(state.settings.projectionYears);
  if (state.settings.projectionYears === resolved) return state;
  return {
    ...state,
    settings: { ...state.settings, projectionYears: resolved },
  };
}

export const persistOptions = {
  name: PERSIST_STORAGE_KEY,
  version: PERSIST_VERSION,
  partialize: partializePersistedState,
  merge: mergePersistedState,
  migrate: migratePersistedState,
};
