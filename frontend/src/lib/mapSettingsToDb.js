import { DEFAULT_SETTINGS, resolveProjectionYearsFromPersist } from './constants';
import { enrichSettingsWithSalary } from './salary';

const APP_DATA_VERSION = 1;

/** Maps store settings (camelCase) to user_settings row (snake_case). */
export function mapSettingsToUserSettingsRow(userId, settings) {
  if (!settings) return null;

  return {
    user_id: userId,
    monthly_net_salary: settings.monthlyNetSalary ?? 0,
    other_monthly_income: settings.otherMonthlyIncome ?? 0,
    mortgage_rent: settings.mortgageRent ?? settings.mortgageRentTotal ?? 0,
    utilities: settings.utilities ?? 0,
    insurance: settings.insurance ?? 0,
    subscriptions: settings.subscriptions ?? 0,
    other_fixed_expenses: settings.otherFixedExpenses ?? 0,
    index_fund_nominal_return: settings.indexFundNominalReturn,
    index_fund_real_return: settings.indexFundRealReturn,
    use_real_return: settings.useRealReturn,
    expected_inflation: settings.expectedInflation,
    pension_plan_return: settings.pensionPlanReturn,
    savings_account_return: settings.savingsAccountReturn,
    annual_salary_increase: settings.annualSalaryIncrease ?? 0,
    projection_years: settings.projectionYears,
    monthly_investment_amount: settings.monthlyInvestmentAmount ?? 0,
  };
}

/** JSON in Supabase: full settings + lists not yet in dedicated tables. */
export function buildAppDataPayload(state) {
  return {
    version: APP_DATA_VERSION,
    settings: state.settings ?? {},
    annualExpenses: state.annualExpenses ?? [],
    cashflowHistory: state.cashflowHistory ?? [],
    contributionPlans: state.contributionPlans ?? [],
    contributionEntries: state.contributionEntries ?? [],
    assets: state.assets ?? [],
    liabilities: state.liabilities ?? [],
    snapshots: state.snapshots ?? [],
    profile: state.profile ?? null,
    onboardingCompleted: Boolean(state.onboardingCompleted),
    locale: state.locale ?? 'es',
    theme: state.theme ?? 'system',
  };
}

export function mapUserSettingsRowToSettings(row) {
  if (!row) return { ...DEFAULT_SETTINGS };

  const app = row.app_data && typeof row.app_data === 'object' ? row.app_data : {};
  const fromApp = app.settings && typeof app.settings === 'object' ? app.settings : {};

  const fromSql = {
    monthlyNetSalary: num(row.monthly_net_salary),
    otherMonthlyIncome: num(row.other_monthly_income),
    mortgageRent: num(row.mortgage_rent),
    utilities: num(row.utilities),
    insurance: num(row.insurance),
    subscriptions: num(row.subscriptions),
    otherFixedExpenses: num(row.other_fixed_expenses),
    indexFundNominalReturn: num(row.index_fund_nominal_return),
    indexFundRealReturn: num(row.index_fund_real_return),
    useRealReturn: row.use_real_return ?? true,
    expectedInflation: num(row.expected_inflation),
    pensionPlanReturn: num(row.pension_plan_return),
    savingsAccountReturn: num(row.savings_account_return),
    annualSalaryIncrease: num(row.annual_salary_increase),
    projectionYears: resolveProjectionYearsFromPersist(row.projection_years),
    monthlyInvestmentAmount: num(row.monthly_investment_amount),
  };

  const merged = {
    ...DEFAULT_SETTINGS,
    ...fromApp,
    ...fromSql,
    projectionYears: resolveProjectionYearsFromPersist(
      fromSql.projectionYears ?? fromApp.projectionYears,
    ),
  };

  return enrichSettingsWithSalary(
    {
      salaryPaysPreset: merged.salaryPaysPreset ?? '12',
      numPagas: merged.numPagas ?? 12,
    },
    merged,
  );
}

export function mapAppDataLists(appData) {
  const app = appData && typeof appData === 'object' ? appData : {};
  return {
    annualExpenses: Array.isArray(app.annualExpenses) ? app.annualExpenses : [],
    cashflowHistory: Array.isArray(app.cashflowHistory)
      ? app.cashflowHistory
      : Array.isArray(app.salaryHistory)
        ? app.salaryHistory
        : [],
    contributionPlans: Array.isArray(app.contributionPlans)
      ? app.contributionPlans
      : [],
    contributionEntries: Array.isArray(app.contributionEntries)
      ? app.contributionEntries
      : [],
    assets: Array.isArray(app.assets) ? app.assets : [],
    liabilities: Array.isArray(app.liabilities) ? app.liabilities : [],
    snapshots: Array.isArray(app.snapshots) ? app.snapshots : [],
    profile: app.profile ?? null,
    onboardingCompleted: Boolean(app.onboardingCompleted),
    locale: app.locale ?? 'es',
    theme: app.theme ?? 'system',
  };
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}
