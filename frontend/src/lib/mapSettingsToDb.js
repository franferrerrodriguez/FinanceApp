/** Mapea settings del store (camelCase) a fila user_settings (snake_case). */
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
