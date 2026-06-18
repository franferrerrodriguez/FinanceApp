import type { EmergencyFundStatus, InsightTone } from './finance.js';

// ─── Projection ───────────────────────────────────────────────────────────────

/**
 * One month of data from the full monthly projection engine.
 * Produced by `buildMonthlyProjectionRows` in `src/lib/calculations.js`.
 */
export interface ProjectionRow {
  monthIndex: number;
  /** Full years elapsed since projection start (0 for months 0–11). */
  yearsElapsed: number;
  date: Date;
  /** True for January rows — used to highlight annual milestones in tables. */
  isJanuary: boolean;
  /** Projected net monthly salary for this month in EUR. */
  salary: number;
  otherIncome: number;
  /** Core fixed expenses (housing + household) for this month in EUR. */
  fixedExpenses: number;
  groceriesExpenses: number;
  leisureExpenses: number;
  /** Additional investment contributions routed to specific buckets in EUR. */
  additionalInvestments: number;
  /** One-off annual expenses falling in this calendar month in EUR. */
  punctualExpenses: number;
  /** Net free cash flow after all expenses and investments in EUR. */
  netContribution: number;
  /** Portfolio return generated this month in EUR. */
  monthlyReturn: number;
  /** Net worth (assets − liabilities) at the start of this month in EUR. */
  patrimonioInicio: number;
  /** Gross assets (before debt) at the start of this month in EUR. */
  grossPatrimonioInicio: number;
  /** Net worth at the end of this month in EUR. */
  patrimonyEnd: number;
  /** Gross assets at the end of this month in EUR. */
  grossPatrimonyEnd: number;
  mortgageAmortizationActive: boolean;
  mortgagePayment: number;
  mortgageInterest: number;
  mortgagePrincipal: number;
  /** Portfolio-weighted annual return applied this month as a decimal. */
  appliedAnnualRate: number;
  appliedWeightedReturn: number;
  appliedMonthlyRate: number;
  /** Balances per investment bucket (assetId or 'default'). */
  bucketBalances: Record<string, number>;
  debtBalance: number;
}

/** Aggregated summary over the full projection horizon. */
export interface ProjectionSummary {
  initialPatrimony: number;
  initialGrossAssets: number;
  initialDebt: number;
  finalPatrimony: number;
  finalGrossAssets: number;
  finalDebt: number;
  totalNetContributed: number;
  totalReturnGenerated: number;
  totalMortgageInterest: number;
  totalMortgagePrincipal: number;
  averageSavingsRate: number;
  mortgageAmortizationActive: boolean;
  /** Expected final value via accounting identity; used to assert coherence. */
  expectedFinal?: number;
  /** True when finalPatrimony matches expectedFinal within 0.05 EUR. */
  isCoherent: boolean;
}

// ─── Amortization ─────────────────────────────────────────────────────────────

/** One payment row in a French-method mortgage amortization schedule. */
export interface AmortizationRow {
  month: number;
  date: Date;
  startBalance: number;
  payment: number;
  interest: number;
  principal: number;
  /** Remaining capital after this payment. */
  balance: number;
}

/** Full schedule plus aggregate totals. */
export interface AmortizationSummary {
  schedule: AmortizationRow[];
  months: number;
  totalInterest: number;
  totalPrincipal: number;
  totalPaid: number;
  monthlyPayment: number;
  endDate: Date | null;
}

/** Savings from an early repayment scenario vs. the baseline schedule. */
export interface AmortizationSavings {
  months: number;
  years: number;
  interest: number;
  /** Present only for recurring extra payment comparisons. */
  totalExtraPaid?: number;
}

// ─── Emergency fund ───────────────────────────────────────────────────────────

/** Output of `computeEmergencyFundMetrics` in `src/lib/emergencyFund.js`. */
export interface EmergencyFundMetrics {
  monthsTarget: number;
  monthlyExpenses: number;
  targetAmount: number;
  /** Current liquid cash (bank + cash accounts) from this month's snapshots. */
  liquid: number;
  monthsCovered: number;
  /** 0–1 progress toward the target. Capped at 1. */
  progress: number;
  shortfall: number;
  status: EmergencyFundStatus;
  hasSnapshots: boolean;
  hasLiquidData: boolean;
  hasLiquidAssets: boolean;
}

// ─── Financial diagnosis ──────────────────────────────────────────────────────

export interface DiagnosisInsight {
  id: string;
  tone: InsightTone;
  params?: Record<string, unknown>;
  href?: string;
  actionKey?: string;
}

export interface FinancialDiagnosis {
  insights: DiagnosisInsight[];
}

// ─── Dashboard KPIs ───────────────────────────────────────────────────────────

export interface DashboardKpis {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  totalIncome: number;
  totalFixedExpenses: number;
  totalVariableExpenses: number;
  savingsRate: number;
  freeCashflow: number;
  monthlyInvestment: number;
  annualExpensesYearly: number;
  annualExpensesMonthlyAvg: number;
  emergencyFund: EmergencyFundMetrics;
  history: Array<{ monthKey: string; netWorth: number }>;
  cashflowSegments: Array<{ name: string; value: number; color: string }>;
  income: number;
  assetDistribution: Array<{ category: string; value: number }>;
  liabilityDistribution: Array<{ category: string; value: number }>;
  topHoldings: {
    topAssets: Array<{ id: string; name: string; value: number }>;
    topLiabilities: Array<{ id: string; name: string; value: number }>;
  };
}
