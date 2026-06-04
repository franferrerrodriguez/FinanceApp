import { DEFAULT_SETTINGS, normalizeProjectionYears } from '../../lib/constants';
import { createAnnualExpense } from '../../lib/annualExpenses';
import {
  CASHFLOW_EXPENSE_SNAPSHOT_KEYS,
  createCashflowEntry,
  enrichCashflowEntry,
  syncSettingsFromCashflowHistory,
  upsertCurrentMonthCashflowTramo,
} from '../../lib/cashflowHistory';
import {
  createContributionPlan,
  getTotalMonthlyContributions,
} from '../../lib/contributionPlans';
import { dedupeFinanceList } from '../../lib/mergeFinanceLists';
import {
  deleteAssetFromCloud,
  deleteLiabilityFromCloud,
} from '../../lib/patrimonyCloud';
import { enrichSettingsWithSalary } from '../../lib/salary';
import {
  getSnapshotAssetId,
  getSnapshotLiabilityId,
  getSnapshotMonthKey,
} from '../../lib/snapshotUtils';

const createId = () =>
  crypto.randomUUID?.() ??
  `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const CASHFLOW_TOUCH_KEYS = new Set([
  'monthlyNetSalary',
  'salaryPaysPreset',
  'numPagas',
  'otherMonthlyIncome',
  ...CASHFLOW_EXPENSE_SNAPSHOT_KEYS,
]);

function syncInvestmentFromPlans(plans) {
  return { monthlyInvestmentAmount: getTotalMonthlyContributions(plans) };
}

/** Settings, assets, liabilities, contributions, and snapshots. */
export const createFinanceSlice = (set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  annualExpenses: [],
  cashflowHistory: [],
  contributionPlans: [],
  assets: [],
  liabilities: [],
  snapshots: [],

  setSettings: (patch) =>
    set((state) => {
      const touchesCashflow = Object.keys(patch).some((k) =>
        CASHFLOW_TOUCH_KEYS.has(k),
      );
      const touchesSalary = ['monthlyNetSalary', 'salaryPaysPreset', 'numPagas'].some(
        (k) => k in patch,
      );

      let next = touchesSalary
        ? enrichSettingsWithSalary(patch, state.settings)
        : { ...state.settings, ...patch };

      if (patch.projectionYears != null) {
        next.projectionYears = normalizeProjectionYears(patch.projectionYears);
      }

      if (touchesCashflow) {
        const cashflowHistory = upsertCurrentMonthCashflowTramo(
          next,
          get().cashflowHistory,
        );
        return { settings: next, cashflowHistory };
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

  addCashflowHistoryEntry: (entry) =>
    set((state) => {
      const cashflowHistory = [
        ...state.cashflowHistory,
        createCashflowEntry(entry, state.settings),
      ];
      return {
        cashflowHistory,
        settings: syncSettingsFromCashflowHistory(state.settings, cashflowHistory),
      };
    }),

  updateCashflowHistoryEntry: (id, patch) =>
    set((state) => {
      const cashflowHistory = state.cashflowHistory.map((e) =>
        e.id === id ? enrichCashflowEntry(patch, e, state.settings) : e,
      );
      return {
        cashflowHistory,
        settings: syncSettingsFromCashflowHistory(state.settings, cashflowHistory),
      };
    }),

  removeCashflowHistoryEntry: (id) =>
    set((state) => {
      if (state.cashflowHistory.length <= 1) return state;
      const cashflowHistory = state.cashflowHistory.filter((e) => e.id !== id);
      return {
        cashflowHistory,
        settings: syncSettingsFromCashflowHistory(state.settings, cashflowHistory),
      };
    }),

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
    set((state) => {
      const id = asset.id ?? createId();
      if (state.assets.some((a) => a.id === id)) return state;
      return {
        assets: dedupeFinanceList([
          ...state.assets,
          { ...asset, id, isActive: true },
        ]),
      };
    }),

  addLiability: (liability) =>
    set((state) => {
      const id = liability.id ?? createId();
      if (state.liabilities.some((l) => l.id === id)) return state;
      return {
        liabilities: dedupeFinanceList([
          ...state.liabilities,
          { ...liability, id, isActive: true },
        ]),
      };
    }),

  addSnapshot: (snapshot) =>
    set((state) => ({
      snapshots: [...state.snapshots, snapshot],
    })),

  updateAsset: (id, patch) =>
    set((state) => ({
      assets: state.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    })),

  updateLiability: (id, patch) =>
    set((state) => ({
      liabilities: state.liabilities.map((l) =>
        l.id === id ? { ...l, ...patch } : l,
      ),
    })),

  setAssetActive: (id, isActive) =>
    set((state) => ({
      assets: state.assets.map((a) =>
        a.id === id ? { ...a, isActive } : a,
      ),
    })),

  setLiabilityActive: (id, isActive) =>
    set((state) => ({
      liabilities: state.liabilities.map((l) =>
        l.id === id ? { ...l, isActive } : l,
      ),
    })),

  removeAsset: (id) => {
    const userId = get().user?.id;
    set((state) => ({
      assets: state.assets.filter((a) => a.id !== id),
      snapshots: state.snapshots.filter((s) => getSnapshotAssetId(s) !== id),
    }));
    if (userId) void deleteAssetFromCloud(userId, id);
  },

  removeLiability: (id) => {
    const userId = get().user?.id;
    set((state) => ({
      liabilities: state.liabilities.filter((l) => l.id !== id),
      snapshots: state.snapshots.filter((s) => getSnapshotLiabilityId(s) !== id),
    }));
    if (userId) void deleteLiabilityFromCloud(userId, id);
  },

  closeMonthSnapshots: (monthKey, newSnapshots) =>
    set((state) => ({
      snapshots: [
        ...state.snapshots.filter((s) => getSnapshotMonthKey(s) !== monthKey),
        ...newSnapshots,
      ],
    })),
});
