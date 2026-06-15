import { DEFAULT_SETTINGS, normalizeProjectionYears } from '../../lib/constants';
import { createAnnualExpense } from '../../lib/annualExpenses';
import {
  CASHFLOW_EXPENSE_SNAPSHOT_KEYS,
  createCashflowEntry,
  enrichCashflowEntry,
  getCurrentCashflowSegment,
  syncSettingsFromCashflowHistory,
  upsertCurrentMonthCashflowTramo,
} from '../../lib/cashflowHistory';
import {
  createContributionPlan,
} from '../../lib/contributionPlans';
import { getEffectiveMonthlyInvestmentAmount } from '../../lib/contributionProjection';
import { rebuildDerivedContributionEntries } from '../../lib/deriveContributionsFromSnapshots';
import { mergeLiabilityOutstandingSnapshot } from '../../lib/liabilitySnapshots';
import { getCurrentMonthKey as getPatrimonyMonthKey } from '../../lib/dashboardMetrics';
import { getCurrentMonthKey } from '../../lib/cashflowHistory';
import { dedupeFinanceList } from '../../lib/mergeFinanceLists';
import { dedupeSnapshots } from '../../lib/snapshotPersist.js';
import {
  deleteAssetFromCloud,
  deleteLiabilityFromCloud,
} from '../../lib/patrimonyCloud';
import {
  createLinkedMortgageLiability,
  getLinkedMortgageLiability,
  HOUSING_TYPE,
} from '../../lib/housingLiability';
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

function syncInvestmentAmount(state) {
  return {
    monthlyInvestmentAmount: getEffectiveMonthlyInvestmentAmount({
      entries: state.contributionEntries,
      contributionPlans: state.contributionPlans,
      assets: state.assets,
      monthKey: getCurrentMonthKey(),
    }),
  };
}

/** Settings, assets, liabilities, contributions, and snapshots. */
export const createFinanceSlice = (set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  annualExpenses: [],
  cashflowHistory: [],
  contributionPlans: [],
  contributionEntries: [],
  assets: [],
  liabilities: [],
  snapshots: [],

  applyHousingType: (nextType, { mortgageName = 'Hipoteca' } = {}) =>
    set((state) => {
      if (nextType === HOUSING_TYPE.RENT || nextType === HOUSING_TYPE.NONE) {
        const linked = getLinkedMortgageLiability(
          state.liabilities,
          state.settings,
        );
        const removeId =
          linked?.id === state.settings.linkedMortgageLiabilityId
            ? linked.id
            : null;
        const userId = get().user?.id;
        if (removeId && userId) void deleteLiabilityFromCloud(userId, removeId);

        return {
          liabilities: removeId
            ? state.liabilities.filter((l) => l.id !== removeId)
            : state.liabilities,
          settings: {
            ...state.settings,
            housingType: nextType,
            linkedMortgageLiabilityId: null,
          },
        };
      }

      const linked = getLinkedMortgageLiability(
        state.liabilities,
        state.settings,
      );
      if (!linked) {
        const created = createLinkedMortgageLiability(mortgageName);
        return {
          liabilities: dedupeFinanceList([
            ...state.liabilities,
            { ...created, isActive: true },
          ]),
          settings: {
            ...state.settings,
            housingType: HOUSING_TYPE.MORTGAGE,
            linkedMortgageLiabilityId: created.id,
          },
        };
      }

      return {
        settings: {
          ...state.settings,
          housingType: HOUSING_TYPE.MORTGAGE,
          linkedMortgageLiabilityId: linked.id,
        },
      };
    }),

  ensureCurrentCashflowTramo: () =>
    set((state) => {
      if (state.cashflowHistory.length > 0) return state;
      return {
        cashflowHistory: upsertCurrentMonthCashflowTramo(
          state.settings,
          state.cashflowHistory,
        ),
      };
    }),

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
      const segment = getCurrentCashflowSegment(cashflowHistory);
      const settings =
        segment?.id === cashflowHistory[cashflowHistory.length - 1]?.id
          ? syncSettingsFromCashflowHistory(state.settings, cashflowHistory)
          : state.settings;
      return { cashflowHistory, settings };
    }),

  updateCashflowHistoryEntry: (id, patch) =>
    set((state) => {
      const cashflowHistory = state.cashflowHistory.map((e) =>
        e.id === id ? enrichCashflowEntry(patch, e, state.settings) : e,
      );
      const updated = cashflowHistory.find((e) => e.id === id);
      const segment = getCurrentCashflowSegment(cashflowHistory);
      const settings =
        updated && segment?.id === updated.id
          ? syncSettingsFromCashflowHistory(state.settings, cashflowHistory)
          : state.settings;
      return { cashflowHistory, settings };
    }),

  removeCashflowHistoryEntry: (id) =>
    set((state) => {
      const cashflowHistory = state.cashflowHistory.filter((e) => e.id !== id);
      return {
        cashflowHistory,
        settings: syncSettingsFromCashflowHistory(state.settings, cashflowHistory),
      };
    }),

  setContributionPlans: (plans) =>
    set((state) => ({
      contributionPlans: plans,
      settings: { ...state.settings, ...syncInvestmentAmount({ ...state, contributionPlans: plans }) },
    })),

  addContributionPlan: (plan) => {
    const state = get();
    const next = [...state.contributionPlans, createContributionPlan(plan)];
    set({
      contributionPlans: next,
      settings: { ...state.settings, ...syncInvestmentAmount({ ...state, contributionPlans: next }) },
    });
  },

  updateContributionPlan: (id, patch) => {
    const state = get();
    const next = state.contributionPlans.map((p) =>
      p.id === id ? { ...p, ...patch } : p,
    );
    set({
      contributionPlans: next,
      settings: { ...state.settings, ...syncInvestmentAmount({ ...state, contributionPlans: next }) },
    });
  },

  removeContributionPlan: (id) => {
    const state = get();
    const next = state.contributionPlans.filter((p) => p.id !== id);
    set({
      contributionPlans: next,
      settings: { ...state.settings, ...syncInvestmentAmount({ ...state, contributionPlans: next }) },
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
    set((state) => {
      const contributionEntries = state.contributionEntries.filter(
        (e) => e.assetId !== id,
      );
      const contributionPlans = state.contributionPlans.filter(
        (p) => p.assetId !== id,
      );
      const nextState = {
        ...state,
        assets: state.assets.filter((a) => a.id !== id),
        snapshots: state.snapshots.filter((s) => getSnapshotAssetId(s) !== id),
        contributionEntries,
        contributionPlans,
      };
      return {
        assets: nextState.assets,
        snapshots: nextState.snapshots,
        contributionEntries,
        contributionPlans,
        settings: {
          ...state.settings,
          ...syncInvestmentAmount(nextState),
        },
      };
    });
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

  setLiabilityOutstandingBalance: (liabilityId, amount, monthKey) =>
    set((state) => {
      const key = monthKey ?? getPatrimonyMonthKey();
      const snapshots = dedupeSnapshots(
        mergeLiabilityOutstandingSnapshot({
          snapshots: state.snapshots,
          liabilityId,
          amount,
          monthKey: key,
        }),
      );
      const contributionEntries = rebuildDerivedContributionEntries({
        snapshots,
        assets: state.assets,
        settings: state.settings,
      });
      const nextState = { ...state, snapshots, contributionEntries };
      return {
        snapshots,
        contributionEntries,
        settings: {
          ...state.settings,
          ...syncInvestmentAmount(nextState),
        },
      };
    }),

  closeMonthSnapshots: (monthKey, newSnapshots) =>
    set((state) => {
      const snapshots = dedupeSnapshots([
        ...state.snapshots.filter((s) => getSnapshotMonthKey(s) !== monthKey),
        ...newSnapshots,
      ]);
      const contributionEntries = rebuildDerivedContributionEntries({
        snapshots,
        assets: state.assets,
        settings: state.settings,
      });
      const nextState = { ...state, snapshots, contributionEntries };
      return {
        snapshots,
        contributionEntries,
        settings: {
          ...state.settings,
          ...syncInvestmentAmount(nextState),
        },
      };
    }),
});
