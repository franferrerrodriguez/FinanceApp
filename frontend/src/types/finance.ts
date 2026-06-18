// ─── Primitive aliases ────────────────────────────────────────────────────────

/** 'YYYY-MM' string used as a key to group financial snapshots by month. */
export type MonthKey = string;

/** 'YYYY-MM-DD' ISO date string for snapshot and event dates. */
export type IsoDateString = string;

// ─── Domain enums ─────────────────────────────────────────────────────────────

export type AssetCategory =
  | 'bank'
  | 'investment'
  | 'etf'
  | 'pension'
  | 'cash'
  | 'real_estate'
  | 'other';

export type LiabilityCategory =
  | 'mortgage'
  | 'personal_loan'
  | 'credit_card'
  | 'family_debt'
  | 'other';

export type HousingType = 'none' | 'rent' | 'mortgage';

/** Number of salary payments per year as a string key. */
export type SalaryPaysPreset = '12' | '13' | '13.5' | '14' | '14.5';

export type ProjectionInvestmentMode = 'fixed' | 'percent_savings' | 'ramp';

export type ProjectionContributionAssumption =
  | 'average_3_months'
  | 'last_month'
  | 'budget';

export type ContributionGrowthMode =
  | 'fixed'
  | 'ramp_monthly'
  | 'annual_increase';

export type EmergencyFundStatus = 'good' | 'warn' | 'danger' | 'unavailable';

export type InsightTone = 'positive' | 'info' | 'warn' | 'tip';

export type DiagnosticStatus = 'ok' | 'warn' | 'opportunity';

export type SnapshotItemType = 'asset' | 'liability';

// ─── Domain entities ──────────────────────────────────────────────────────────

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  /** Institution or provider identifier (e.g. 'santander', 'indexa'). */
  provider: string;
  notes: string;
  /** Overrides the default annual return for this asset in projections. null = use default. */
  customAnnualReturn: number | null;
  isActive: boolean;
  /** If true, gain/loss entries are recorded alongside balance snapshots. */
  tracksGainLoss?: boolean;
}

export interface Liability {
  id: string;
  name: string;
  category: LiabilityCategory;
  /** Fixed monthly installment in EUR. */
  monthlyPayment: number;
  /** Annual interest rate as a decimal (e.g. 0.025 = 2.5 %). */
  interestRate: number;
  isActive: boolean;
  /** Shared mortgage split configuration. */
  shareInfo?: {
    /** Your share of the monthly payment in EUR. */
    amount?: number;
    /** Your ownership percentage (0–100). */
    percent?: number;
  };
  /** Outstanding capital remaining on the loan in EUR. */
  remainingCapital?: number;
  /** Original total loan amount in EUR. */
  totalAmount?: number;
}

/**
 * A point-in-time balance record for a single asset or liability.
 * Supports both camelCase (in-memory) and snake_case (legacy DB) field names.
 */
export interface PatrimonySnapshot {
  id?: string;
  /** Asset this snapshot belongs to (mutually exclusive with liabilityId). */
  assetId?: string | null;
  /** Liability this snapshot belongs to (mutually exclusive with assetId). */
  liabilityId?: string | null;
  /** ISO date of the snapshot, e.g. '2025-06-30'. */
  snapshotDate?: IsoDateString;
  /** Balance in EUR at the snapshot date. */
  value: number;
  /** Gain or loss recorded for this period (investment assets only). */
  gainLoss?: number | null;
  // Legacy snake_case DB fields
  asset_id?: string | null;
  liability_id?: string | null;
  snapshot_date?: IsoDateString;
  date?: string;
}

export interface AnnualExpense {
  id: string;
  name: string;
  /** Amount in EUR per occurrence. */
  amount: number;
  /** Calendar month of the expense (1 = January, 12 = December). */
  month: number;
}

/**
 * A salary/income tramo (period) with its associated expense snapshot.
 * Effective from a given month forward until superseded by a newer entry.
 */
export interface CashflowEntry {
  id: string;
  effectiveFrom: MonthKey;
  monthlyNetSalary: number;
  salaryPaysPreset: SalaryPaysPreset;
  numPagas: number;
  otherMonthlyIncome: number;
  /** Snapshot of expense settings at the time this tramo was created. */
  expenses: Record<string, number | boolean>;
  note: string;
  // Enriched derived fields
  monthlyNetSalaryEffective?: number;
  incomeMonthly?: number;
  fixedExpensesMonthly?: number;
  variableExpensesMonthly?: number;
}

/** A planned recurring contribution to a specific investment account. */
export interface ContributionPlan {
  id: string;
  /** Linked asset id. null means the plan is not yet tied to an asset. */
  assetId: string | null;
  /** Provider identifier (e.g. 'indexa', 'myinvestor'). */
  providerId: string;
  category: AssetCategory;
  label: string;
  /** Base monthly contribution amount in EUR. */
  monthlyAmount: number;
  effectiveFrom: MonthKey;
  isActive: boolean;
  growthMode: ContributionGrowthMode;
  /** EUR increase per month when growthMode is 'ramp_monthly'. */
  rampPerMonth: number;
  /** Annual percentage increase when growthMode is 'annual_increase'. */
  annualIncrease: number;
  customAnnualReturn: number | null;
}

/** A recorded actual contribution for a specific asset in a given month. */
export interface ContributionEntry {
  id: string;
  assetId: string | null;
  monthKey: MonthKey;
  amount: number;
  /** How this entry was derived: from real input, snapshots, or projection plans. */
  source:
    | 'actual'
    | 'derived'
    | 'derived_history'
    | 'history'
    | 'legacy_plans'
    | 'budget';
  category?: AssetCategory;
  providerId?: string;
  label?: string;
}

// ─── App settings ─────────────────────────────────────────────────────────────

/**
 * Full user financial settings object stored in Zustand and persisted to Supabase.
 * All monetary amounts are in EUR; all rates are decimal fractions (0.05 = 5 %).
 */
export interface AppSettings {
  // Income
  monthlyNetSalary: number;
  salaryPaysPreset: SalaryPaysPreset;
  numPagas: number;
  /** Computed effective monthly salary accounting for extra pagas. */
  monthlyNetSalaryEffective: number;
  otherMonthlyIncome: number;

  // Housing
  housingType: HousingType;
  linkedMortgageLiabilityId: string | null;
  mortgageRent: number;
  mortgageRentTotal: number;
  mortgageRentShared: boolean;
  mortgageRentYourSharePercent: number;
  mortgageRentIsEstimate: boolean;

  // Household fixed expenses
  householdFixedEstimate: number;
  householdFixedIsEstimate: boolean;
  householdFixedShared: boolean;
  householdFixedYourSharePercent: number;
  useDetailedExpenses: boolean;
  utilities: number;
  utilitiesIsEstimate: boolean;
  insurance: number;
  insuranceIsEstimate: boolean;
  subscriptions: number;
  subscriptionsIsEstimate: boolean;
  otherFixedExpenses: number;
  otherFixedExpensesIsEstimate: boolean;

  // Variable expenses
  groceriesEstimate: number;
  groceriesIsEstimate: boolean;
  groceriesShared: boolean;
  groceriesYourSharePercent: number;
  leisureEstimate: number;
  leisureIsEstimate: boolean;
  leisureShared: boolean;
  leisureYourSharePercent: number;

  // Investment budget
  monthlyInvestmentAmount: number;
  monthlyBudgetInvestment: number;

  // Emergency fund
  emergencyFundMonths: number;
  emergencyFundCountsInvestment: boolean;

  // Projection
  initialPatrimony: number;
  indexFundNominalReturn: number;
  indexFundRealReturn: number;
  useRealReturn: boolean;
  expectedInflation: number;
  pensionPlanReturn: number;
  savingsAccountReturn: number;
  projectionYears: number;
  annualSalaryIncrease: number;
  projectionInvestmentMode: ProjectionInvestmentMode;
  projectionInvestmentRampMonthly: number;
  projectionInvestmentPercentOfSavings: number;
  projectionInvestmentAnnualIncrease: number;
  projectionAnnualExpenseIncrease: number;
  projectionContributionAssumption: ProjectionContributionAssumption;

  // Savings rate display thresholds
  SAVINGS_RATE_GREEN: number;
  SAVINGS_RATE_YELLOW: number;

  // Optional enriched/dynamic fields
  annualSalaryGross?: number;
  customAnnualReturn?: number | null;
}

// ─── Notification / alert types ───────────────────────────────────────────────

export interface DiagnosisInsight {
  id: string;
  tone: InsightTone;
  params?: Record<string, unknown>;
  href?: string;
  actionKey?: string;
}

export interface DiagnosticItem {
  id: string;
  status: DiagnosticStatus;
  titleKey: string;
  bodyKey: string;
  params?: Record<string, number | string>;
  actionKey?: string;
  actionHref?: string;
}

export interface FinanceAlert {
  id: string;
  severity: 'danger' | 'warn' | 'info';
  params?: Record<string, unknown>;
  href?: string;
  actionKey?: string;
}

// ─── User / session ───────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
}
