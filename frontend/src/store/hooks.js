import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from './appStore';

export function useOnboardingState() {
  return useAppStore(
    useShallow((s) => ({
      completed: s.onboardingCompleted,
      step: s.onboardingStep,
      setStep: s.setOnboardingStep,
      complete: s.completeOnboarding,
    })),
  );
}

export function useProfile() {
  return useAppStore(
    useShallow((s) => ({
      profile: s.profile,
      setProfile: s.setProfile,
    })),
  );
}

export function useSettings() {
  return useAppStore(
    useShallow((s) => ({
      settings: s.settings,
      setSettings: s.setSettings,
    })),
  );
}

export function useFinanceData() {
  return useAppStore(
    useShallow((s) => ({
      settings: s.settings,
      annualExpenses: s.annualExpenses,
      salaryHistory: s.salaryHistory,
      contributionPlans: s.contributionPlans,
      assets: s.assets,
      liabilities: s.liabilities,
      snapshots: s.snapshots,
      setSettings: s.setSettings,
      addAnnualExpense: s.addAnnualExpense,
      updateAnnualExpense: s.updateAnnualExpense,
      removeAnnualExpense: s.removeAnnualExpense,
      addSalaryHistoryEntry: s.addSalaryHistoryEntry,
      updateSalaryHistoryEntry: s.updateSalaryHistoryEntry,
      removeSalaryHistoryEntry: s.removeSalaryHistoryEntry,
      addContributionPlan: s.addContributionPlan,
      updateContributionPlan: s.updateContributionPlan,
      removeContributionPlan: s.removeContributionPlan,
      addAsset: s.addAsset,
      addLiability: s.addLiability,
      addSnapshot: s.addSnapshot,
    })),
  );
}

export function usePreferences() {
  return useAppStore(
    useShallow((s) => ({
      locale: s.locale,
      theme: s.theme,
      setLocale: s.setLocale,
      setTheme: s.setTheme,
    })),
  );
}

export function useSessionMeta() {
  return useAppStore(
    useShallow((s) => ({
      user: s.user,
      sessionStatus: s.sessionStatus,
      saveBannerSnoozedUntil: s.saveBannerSnoozedUntil,
      setUser: s.setUser,
      logout: s.logout,
      snoozeSaveBanner: s.snoozeSaveBanner,
      incrementActiveMinutes: s.incrementActiveMinutes,
    })),
  );
}
