export const DEFAULT_SETTINGS = {
  monthlyNetSalary: 0,
  salaryPaysPreset: '12',
  numPagas: 12,
  monthlyNetSalaryEffective: 0,
  emergencyFundMonths: 6,
  otherMonthlyIncome: 0,
  mortgageRent: 0,
  mortgageRentTotal: 0,
  mortgageRentShared: false,
  mortgageRentYourSharePercent: 50,
  mortgageRentIsEstimate: true,
  housingType: 'rent',
  linkedMortgageLiabilityId: null,
  householdFixedEstimate: 0,
  householdFixedIsEstimate: true,
  householdFixedShared: false,
  householdFixedYourSharePercent: 50,
  groceriesEstimate: 0,
  groceriesIsEstimate: true,
  groceriesShared: false,
  groceriesYourSharePercent: 50,
  leisureEstimate: 0,
  leisureIsEstimate: true,
  leisureShared: false,
  leisureYourSharePercent: 50,
  useDetailedExpenses: false,
  utilities: 0,
  utilitiesIsEstimate: true,
  insurance: 0,
  insuranceIsEstimate: false,
  subscriptions: 0,
  subscriptionsIsEstimate: false,
  otherFixedExpenses: 0,
  otherFixedExpensesIsEstimate: false,
  monthlyInvestmentAmount: 0,
  monthlyBudgetInvestment: 0,
  emergencyFundCountsInvestment: false,
  initialPatrimony: 0,

  indexFundNominalReturn: 0.06,
  indexFundRealReturn: 0.04,
  useRealReturn: true,
  expectedInflation: 0.02,
  pensionPlanReturn: 0.035,
  savingsAccountReturn: 0.025,

  projectionYears: 20,
  annualSalaryIncrease: 0,
  projectionInvestmentMode: 'fixed',
  projectionInvestmentRampMonthly: 0,
  projectionInvestmentPercentOfSavings: 0.5,
  projectionInvestmentAnnualIncrease: 0,
  projectionAnnualExpenseIncrease: 0,
  projectionContributionAssumption: 'average_3_months',

  SAVINGS_RATE_GREEN: 0.2,
  SAVINGS_RATE_YELLOW: 0.1,
};

export const PROJECTION_YEARS_DEFAULT = 20;

/** Emergency fund runway choices (months of expenses). */
export const EMERGENCY_FUND_MONTH_OPTIONS = [3, 4, 6, 9, 12, 18, 24];

/** Typical expert guideline for stable employment (3–6 months; 6 is common). */
export const EMERGENCY_FUND_RECOMMENDED_MONTHS = 6;

/** Show register prompt again after user taps "Later". */
export const SAVE_BANNER_SNOOZE_MS = 24 * 60 * 60 * 1000;

/** Projection horizon (1–50 years; default 20). */
export function normalizeProjectionYears(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return PROJECTION_YEARS_DEFAULT;
  return Math.min(50, Math.max(1, Math.round(n)));
}

/** Invalid or legacy values (e.g. test value 2) → product default. */
export function resolveProjectionYearsFromPersist(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return PROJECTION_YEARS_DEFAULT;
  if (n <= 2) return PROJECTION_YEARS_DEFAULT;
  return normalizeProjectionYears(n);
}

export const ASSET_CATEGORY_VALUES = [
  'bank',
  'investment',
  'etf',
  'pension',
  'cash',
  'real_estate',
  'other',
];

export const LIABILITY_CATEGORY_VALUES = [
  'mortgage',
  'personal_loan',
  'credit_card',
  'family_debt',
  'other',
];

/** Only adjust fund returns; income/expenses are edited under Balance. */
export const PROJECTION_SCENARIOS = {
  conservative: { indexFundRealReturn: 0.03 },
  moderate: { indexFundRealReturn: 0.04 },
  optimistic: { indexFundRealReturn: 0.06 },
};
