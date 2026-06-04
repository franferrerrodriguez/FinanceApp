import { DEFAULT_SETTINGS, normalizeProjectionYears } from '../../lib/constants';
import { createAnnualExpense } from '../../lib/annualExpenses';
import {
  createSalaryHistoryEntry,
  enrichSalaryHistoryEntry,
} from '../../lib/salaryHistory';
import {
  createContributionPlan,
  getTotalMonthlyContributions,
} from '../../lib/contributionPlans';
import { enrichSettingsWithSalary } from '../../lib/salary';

const createId = () =>
  crypto.randomUUID?.() ??
  `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function syncInvestmentFromPlans(plans) {
  return { monthlyInvestmentAmount: getTotalMonthlyContributions(plans) };
}

/** Ajustes, activos, pasivos, aportaciones y snapshots. */
export const createFinanceSlice = (set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  annualExpenses: [],
  salaryHistory: [],
  contributionPlans: [],
  assets: [],
  liabilities: [],
  snapshots: [],

  setSettings: (patch) =>
    set((state) => {
      const salaryKeys = new Set([
        'monthlyNetSalary',
        'salaryPaysPreset',
        'numPagas',
      ]);
      const touchesSalary = Object.keys(patch).some((k) => salaryKeys.has(k));

      let next = touchesSalary
        ? enrichSettingsWithSalary(patch, state.settings)
        : { ...state.settings, ...patch };

      if (patch.projectionYears != null) {
        next.projectionYears = normalizeProjectionYears(patch.projectionYears);
      }
      return { settings: next };
    }),

  addAnnualExpense: (expense) =>
    set((state) => ({
      annualExpenses: [
        ...state.annualExpenses,
        createAnnualExpense(expense),
      ],
    })),

  updateAnnualExpense: (id, patch) =>
    set((state) => ({
      annualExpenses: state.annualExpenses.map((e) =>
        e.id === id ? { ...e, ...patch } : e,
      ),
    })),

  removeAnnualExpense: (id) =>
    set((state) => ({
      annualExpenses: state.annualExpenses.filter((e) => e.id !== id),
    })),

  addSalaryHistoryEntry: (entry) =>
    set((state) => ({
      salaryHistory: [...state.salaryHistory, createSalaryHistoryEntry(entry)],
    })),

  updateSalaryHistoryEntry: (id, patch) =>
    set((state) => ({
      salaryHistory: state.salaryHistory.map((e) =>
        e.id === id ? enrichSalaryHistoryEntry(patch, e) : e,
      ),
    })),

  removeSalaryHistoryEntry: (id) =>
    set((state) => ({
      salaryHistory: state.salaryHistory.filter((e) => e.id !== id),
    })),

  setContributionPlans: (plans) =>
    set({
      contributionPlans: plans,
      settings: {
        ...get().settings,
        ...syncInvestmentFromPlans(plans),
      },
    }),

  addContributionPlan: (plan) => {
    const next = [
      ...get().contributionPlans,
      createContributionPlan(plan),
    ];
    set({
      contributionPlans: next,
      settings: {
        ...get().settings,
        ...syncInvestmentFromPlans(next),
      },
    });
  },

  updateContributionPlan: (id, patch) => {
    const next = get().contributionPlans.map((p) =>
      p.id === id ? { ...p, ...patch } : p,
    );
    set({
      contributionPlans: next,
      settings: {
        ...get().settings,
        ...syncInvestmentFromPlans(next),
      },
    });
  },

  removeContributionPlan: (id) => {
    const next = get().contributionPlans.filter((p) => p.id !== id);
    set({
      contributionPlans: next,
      settings: {
        ...get().settings,
        ...syncInvestmentFromPlans(next),
      },
    });
  },

  addAsset: (asset) =>
    set((state) => ({
      assets: [
        ...state.assets,
        { ...asset, id: asset.id ?? createId(), isActive: true },
      ],
    })),

  addLiability: (liability) =>
    set((state) => ({
      liabilities: [
        ...state.liabilities,
        {
          ...liability,
          id: liability.id ?? createId(),
          isActive: true,
        },
      ],
    })),

  addSnapshot: (snapshot) =>
    set((state) => ({
      snapshots: [...state.snapshots, snapshot],
    })),
});
