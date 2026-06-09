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
      cashflowHistory: s.cashflowHistory,
      contributionPlans: s.contributionPlans,
      contributionEntries: s.contributionEntries,
      assets: s.assets,
      liabilities: s.liabilities,
      snapshots: s.snapshots,
      setSettings: s.setSettings,
      applyHousingType: s.applyHousingType,
      addAnnualExpense: s.addAnnualExpense,
      updateAnnualExpense: s.updateAnnualExpense,
      removeAnnualExpense: s.removeAnnualExpense,
      ensureCurrentCashflowTramo: s.ensureCurrentCashflowTramo,
      addCashflowHistoryEntry: s.addCashflowHistoryEntry,
      updateCashflowHistoryEntry: s.updateCashflowHistoryEntry,
      removeCashflowHistoryEntry: s.removeCashflowHistoryEntry,
      addContributionPlan: s.addContributionPlan,
      updateContributionPlan: s.updateContributionPlan,
      removeContributionPlan: s.removeContributionPlan,
      addAsset: s.addAsset,
      updateAsset: s.updateAsset,
      setAssetActive: s.setAssetActive,
      removeAsset: s.removeAsset,
      addLiability: s.addLiability,
      updateLiability: s.updateLiability,
      setLiabilityActive: s.setLiabilityActive,
      removeLiability: s.removeLiability,
      addSnapshot: s.addSnapshot,
      closeMonthSnapshots: s.closeMonthSnapshots,
      setLiabilityOutstandingBalance: s.setLiabilityOutstandingBalance,
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
      cloudSyncStatus: s.cloudSyncStatus,
      saveBannerSnoozedUntil: s.saveBannerSnoozedUntil,
      setUser: s.setUser,
      logout: s.logout,
      snoozeSaveBanner: s.snoozeSaveBanner,
      incrementActiveMinutes: s.incrementActiveMinutes,
    })),
  );
}
