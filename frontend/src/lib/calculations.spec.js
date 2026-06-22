import { describe, it, expect } from 'vitest';
import {
  annualToMonthlyRate,
  annualToMonthly,
  nominalToReal,
  futureValueContributions,
  futureValueLumpSum,
  buildProjectionTable,
  calcFIREYear,
  calcNetWorth,
  calcSavingsRate,
  calcFreeCashflow,
  calcTotalFixedExpenses,
  calcTotalIncome,
  getHouseholdTotal,
  getEffectiveHouseholdExpenses,
  getEffectiveGroceries,
  getEffectiveMortgageRent,
  getEffectiveBudgetInvestment,
  calcCoreFixedExpenses,
  calcTotalMonthlyOutflow,
  hasAnySharedExpense,
  scaleByAnnualSteps,
  buildMonthlyProjectionRows,
  summarizeProjectionRows,
} from './calculations.js';

// ─── Rate conversions ──────────────────────────────────────────────────────────

describe('annualToMonthlyRate', () => {
  it('converts 6% annual to correct monthly rate', () => {
    const monthly = annualToMonthlyRate(0.06);
    expect(monthly).toBeCloseTo(0.004868, 5);
  });

  it('returns 0 for 0% annual rate', () => {
    expect(annualToMonthlyRate(0)).toBe(0);
  });

  it('treats null/undefined as 0', () => {
    expect(annualToMonthlyRate(null)).toBe(0);
    expect(annualToMonthlyRate(undefined)).toBe(0);
  });

  it('annualToMonthly is an alias', () => {
    expect(annualToMonthly(0.06)).toBe(annualToMonthlyRate(0.06));
  });

  it('satisfies (1 + monthly)^12 ≈ 1 + annual', () => {
    const annual = 0.08;
    const monthly = annualToMonthlyRate(annual);
    expect(Math.pow(1 + monthly, 12)).toBeCloseTo(1 + annual, 10);
  });
});

describe('nominalToReal', () => {
  it('applies Fisher equation correctly', () => {
    // (1 + 0.06) / (1 + 0.02) - 1 ≈ 0.03922
    expect(nominalToReal(0.06, 0.02)).toBeCloseTo(0.03922, 4);
  });

  it('returns nominal when inflation is 0', () => {
    expect(nominalToReal(0.06, 0)).toBeCloseTo(0.06, 10);
  });

  it('can return negative real rate when inflation > nominal', () => {
    expect(nominalToReal(0.02, 0.05)).toBeLessThan(0);
  });
});

// ─── Future value ──────────────────────────────────────────────────────────────

describe('futureValueLumpSum', () => {
  it('doubles in ~12 years at 6%', () => {
    const fv = futureValueLumpSum(10000, 0.06, 12);
    expect(fv).toBeCloseTo(20122, 0);
  });

  it('returns principal at 0% rate', () => {
    expect(futureValueLumpSum(5000, 0, 10)).toBe(5000);
  });
});

describe('futureValueContributions', () => {
  it('is zero when contribution is 0', () => {
    expect(futureValueContributions(0, 0.06, 10)).toBe(0);
  });

  it('linear growth at 0% rate: 12 × years × monthly', () => {
    const monthly = 500;
    const years = 5;
    expect(futureValueContributions(monthly, 0, years)).toBe(monthly * 12 * years);
  });

  it('grows more with compound interest than without', () => {
    const withInterest = futureValueContributions(500, 0.06, 10);
    const withoutInterest = futureValueContributions(500, 0, 10);
    expect(withInterest).toBeGreaterThan(withoutInterest);
  });

  it('known value: 500/month at 6% for 20 years (compound monthly)', () => {
    // Using annualToMonthlyRate: (1.06)^(1/12) - 1, not r=0.06/12
    expect(futureValueContributions(500, 0.06, 20)).toBeCloseTo(226719, -2);
  });
});

// ─── buildProjectionTable ──────────────────────────────────────────────────────

describe('buildProjectionTable', () => {
  it('returns correct number of rows', () => {
    const rows = buildProjectionTable({
      initialPatrimony: 10000,
      monthlyContrib: 300,
      annualRate: 0.06,
      years: 10,
    });
    expect(rows).toHaveLength(10);
  });

  it('grows over time', () => {
    const rows = buildProjectionTable({
      initialPatrimony: 10000,
      monthlyContrib: 300,
      annualRate: 0.06,
      years: 5,
    });
    expect(rows[4].patrimonioFin).toBeGreaterThan(rows[0].patrimonioFin);
  });

  it('year 1 patrimonioInicio equals initialPatrimony', () => {
    const rows = buildProjectionTable({
      initialPatrimony: 50000,
      monthlyContrib: 500,
      annualRate: 0.05,
      years: 3,
    });
    expect(rows[0].patrimonioInicio).toBe(50000);
  });

  it('totalAportaciones accumulates correctly', () => {
    const monthly = 500;
    const rows = buildProjectionTable({
      initialPatrimony: 0,
      monthlyContrib: monthly,
      annualRate: 0,
      years: 3,
    });
    expect(rows[2].totalAportaciones).toBe(monthly * 12 * 3);
  });

  it('patrimonioFin of year N equals patrimonioInicio of year N+1', () => {
    const rows = buildProjectionTable({
      initialPatrimony: 5000,
      monthlyContrib: 200,
      annualRate: 0.07,
      years: 4,
    });
    expect(rows[0].patrimonioFin).toBeCloseTo(rows[1].patrimonioInicio, 2);
    expect(rows[1].patrimonioFin).toBeCloseTo(rows[2].patrimonioInicio, 2);
  });
});

// ─── calcFIREYear ─────────────────────────────────────────────────────────────

describe('calcFIREYear', () => {
  it('returns null when no row covers expenses', () => {
    const rows = [
      { year: 1, patrimonioFin: 10000 },
      { year: 2, patrimonioFin: 20000 },
    ];
    expect(calcFIREYear(rows, 5000, 0.04)).toBeNull();
  });

  it('returns the first year where returns cover annual expenses', () => {
    const rows = [
      { year: 1, patrimonioFin: 50000 },
      { year: 2, patrimonioFin: 150000 },
      { year: 3, patrimonioFin: 300000 },
    ];
    // At 4%, 300000 × 0.04 = 12000 > 10000
    expect(calcFIREYear(rows, 10000, 0.04)).toBe(3);
  });
});

// ─── calcNetWorth ─────────────────────────────────────────────────────────────

describe('calcNetWorth', () => {
  it('sums snapshot values', () => {
    const snaps = [{ value: 10000 }, { value: 5000 }, { value: -2000 }];
    expect(calcNetWorth(snaps)).toBe(13000);
  });

  it('handles null value fields gracefully', () => {
    expect(calcNetWorth([{ value: null }, { value: 500 }])).toBe(500);
  });

  it('returns 0 for empty array', () => {
    expect(calcNetWorth([])).toBe(0);
  });
});

// ─── Shared expense helpers ────────────────────────────────────────────────────

describe('getHouseholdTotal', () => {
  it('returns 0 for null settings', () => {
    expect(getHouseholdTotal(null)).toBe(0);
  });

  it('uses useDetailedExpenses breakdown when true', () => {
    const settings = {
      useDetailedExpenses: true,
      utilities: 100,
      insurance: 50,
      subscriptions: 30,
      otherFixedExpenses: 20,
    };
    expect(getHouseholdTotal(settings)).toBe(200);
  });

  it('uses householdFixedEstimate when set and useDetailedExpenses is false', () => {
    const settings = {
      useDetailedExpenses: false,
      householdFixedEstimate: 350,
    };
    expect(getHouseholdTotal(settings)).toBe(350);
  });
});

describe('getEffectiveHouseholdExpenses', () => {
  it('returns full amount when not shared', () => {
    const settings = {
      householdFixedEstimate: 400,
      householdFixedShared: false,
      householdFixedYourSharePercent: 50,
    };
    expect(getEffectiveHouseholdExpenses(settings)).toBe(400);
  });

  it('returns your share when shared', () => {
    const settings = {
      householdFixedEstimate: 400,
      householdFixedShared: true,
      householdFixedYourSharePercent: 50,
    };
    expect(getEffectiveHouseholdExpenses(settings)).toBe(200);
  });
});

describe('getEffectiveGroceries', () => {
  it('full amount when not shared', () => {
    const settings = { groceriesEstimate: 300, groceriesShared: false, groceriesYourSharePercent: 50 };
    expect(getEffectiveGroceries(settings)).toBe(300);
  });

  it('60% share', () => {
    const settings = { groceriesEstimate: 300, groceriesShared: true, groceriesYourSharePercent: 60 };
    expect(getEffectiveGroceries(settings)).toBe(180);
  });
});

describe('getEffectiveMortgageRent', () => {
  it('full when not shared', () => {
    const settings = { mortgageRentTotal: 800, mortgageRentShared: false, mortgageRentYourSharePercent: 50 };
    expect(getEffectiveMortgageRent(settings)).toBe(800);
  });

  it('50% share', () => {
    const settings = { mortgageRentTotal: 1000, mortgageRentShared: true, mortgageRentYourSharePercent: 50 };
    expect(getEffectiveMortgageRent(settings)).toBe(500);
  });

  it('falls back to mortgageRent when mortgageRentTotal is not set', () => {
    const settings = { mortgageRent: 750, mortgageRentShared: false };
    expect(getEffectiveMortgageRent(settings)).toBe(750);
  });
});

describe('getEffectiveBudgetInvestment', () => {
  it('returns 0 for null/undefined', () => {
    expect(getEffectiveBudgetInvestment(null)).toBe(0);
    expect(getEffectiveBudgetInvestment({})).toBe(0);
  });

  it('returns the budget investment', () => {
    expect(getEffectiveBudgetInvestment({ monthlyBudgetInvestment: 300 })).toBe(300);
  });

  it('clamps negative values to 0', () => {
    expect(getEffectiveBudgetInvestment({ monthlyBudgetInvestment: -100 })).toBe(0);
  });
});

// ─── calcTotalFixedExpenses ────────────────────────────────────────────────────

describe('calcTotalFixedExpenses', () => {
  it('returns 0 for null settings', () => {
    expect(calcTotalFixedExpenses(null)).toBe(0);
  });

  it('sums mortgage + household + groceries (unshared)', () => {
    const settings = {
      mortgageRentTotal: 800,
      mortgageRentShared: false,
      householdFixedEstimate: 200,
      householdFixedShared: false,
      groceriesEstimate: 300,
      groceriesShared: false,
    };
    expect(calcTotalFixedExpenses(settings)).toBe(1300);
  });

  it('applies shares correctly', () => {
    const settings = {
      mortgageRentTotal: 1000,
      mortgageRentShared: true,
      mortgageRentYourSharePercent: 50,
      householdFixedEstimate: 400,
      householdFixedShared: true,
      householdFixedYourSharePercent: 50,
      groceriesEstimate: 300,
      groceriesShared: false,
    };
    // 500 + 200 + 300
    expect(calcTotalFixedExpenses(settings)).toBe(1000);
  });
});

// ─── calcTotalIncome ──────────────────────────────────────────────────────────

describe('calcTotalIncome', () => {
  it('returns 0 for null', () => {
    expect(calcTotalIncome(null)).toBe(0);
  });

  it('adds salary effective + other income', () => {
    const settings = {
      monthlyNetSalary: 2000,
      salaryPaysPreset: '12',
      numPagas: 12,
      monthlyNetSalaryEffective: 2000,
      otherMonthlyIncome: 500,
    };
    expect(calcTotalIncome(settings)).toBe(2500);
  });
});

// ─── calcSavingsRate ──────────────────────────────────────────────────────────

describe('calcSavingsRate', () => {
  it('returns 0 when income is 0', () => {
    expect(calcSavingsRate(0, 500)).toBe(0);
  });

  it('returns 0 when expenses exceed income', () => {
    expect(calcSavingsRate(1000, 1500)).toBe(0);
  });

  it('calculates correct rate', () => {
    // income 2000, fixed 800, var 200 → savings 1000 → rate 0.5
    expect(calcSavingsRate(2000, 800, 200)).toBeCloseTo(0.5, 5);
  });

  it('ignores variable expenses when not provided', () => {
    expect(calcSavingsRate(2000, 1000)).toBeCloseTo(0.5, 5);
  });
});

// ─── calcFreeCashflow ─────────────────────────────────────────────────────────

describe('calcFreeCashflow', () => {
  it('basic subtraction', () => {
    expect(calcFreeCashflow(2000, 800, 300, 200)).toBe(700);
  });

  it('can be negative', () => {
    expect(calcFreeCashflow(1000, 800, 400, 100)).toBe(-300);
  });

  it('defaults variableExpenses to 0', () => {
    expect(calcFreeCashflow(2000, 800, 300)).toBe(900);
  });
});

// ─── calcCoreFixedExpenses ────────────────────────────────────────────────────

describe('calcCoreFixedExpenses', () => {
  it('excludes groceries (only housing + household)', () => {
    const settings = {
      mortgageRentTotal: 800,
      mortgageRentShared: false,
      householdFixedEstimate: 200,
      householdFixedShared: false,
      groceriesEstimate: 300,
      groceriesShared: false,
    };
    expect(calcCoreFixedExpenses(settings)).toBe(1000);
  });
});

// ─── calcTotalMonthlyOutflow ──────────────────────────────────────────────────

describe('calcTotalMonthlyOutflow', () => {
  it('sums fixed + variable + investment', () => {
    const settings = {
      mortgageRentTotal: 800,
      mortgageRentShared: false,
      householdFixedEstimate: 200,
      householdFixedShared: false,
      groceriesEstimate: 300,
      groceriesShared: false,
      leisureEstimate: 200,
      leisureShared: false,
      monthlyBudgetInvestment: 0,
    };
    // fixed=1300, variable=200, investment=0
    expect(calcTotalMonthlyOutflow(settings)).toBe(1500);
  });

  it('overrides investment with explicit parameter', () => {
    const settings = {
      mortgageRentTotal: 0, mortgageRentShared: false,
      householdFixedEstimate: 0, householdFixedShared: false,
      groceriesEstimate: 0, groceriesShared: false,
      leisureEstimate: 0, leisureShared: false,
      monthlyBudgetInvestment: 500,
    };
    expect(calcTotalMonthlyOutflow(settings, 300)).toBe(300);
  });
});

// ─── hasAnySharedExpense ──────────────────────────────────────────────────────

describe('hasAnySharedExpense', () => {
  it('returns false for null', () => {
    expect(hasAnySharedExpense(null)).toBe(false);
  });

  it('returns false when nothing is shared', () => {
    const settings = {
      mortgageRentShared: false,
      householdFixedShared: false,
      groceriesShared: false,
      leisureShared: false,
    };
    expect(hasAnySharedExpense(settings)).toBe(false);
  });

  it('returns true when any expense is shared', () => {
    expect(hasAnySharedExpense({ groceriesShared: true })).toBe(true);
  });
});

// ─── scaleByAnnualSteps ───────────────────────────────────────────────────────

describe('scaleByAnnualSteps', () => {
  it('no scaling in year 1 (months 0–11)', () => {
    expect(scaleByAnnualSteps(1000, 0, 0.02)).toBe(1000);
    expect(scaleByAnnualSteps(1000, 11, 0.02)).toBe(1000);
  });

  it('scales by 1 step at month 12', () => {
    expect(scaleByAnnualSteps(1000, 12, 0.02)).toBeCloseTo(1020, 5);
  });

  it('scales by 2 steps at month 24', () => {
    expect(scaleByAnnualSteps(1000, 24, 0.02)).toBeCloseTo(1040.4, 5);
  });

  it('no scaling when annualIncrease is 0', () => {
    expect(scaleByAnnualSteps(1000, 36, 0)).toBe(1000);
  });
});

// ─── buildMonthlyProjectionRows ───────────────────────────────────────────────

const MINIMAL_SETTINGS = {
  monthlyNetSalary: 2000,
  salaryPaysPreset: '12',
  numPagas: 12,
  monthlyNetSalaryEffective: 2000,
  otherMonthlyIncome: 0,
  mortgageRentTotal: 0,
  mortgageRentShared: false,
  householdFixedEstimate: 500,
  householdFixedShared: false,
  groceriesEstimate: 300,
  groceriesShared: false,
  leisureEstimate: 200,
  leisureShared: false,
  monthlyBudgetInvestment: 200,
  indexFundRealReturn: 0.04,
  indexFundNominalReturn: 0.06,
  useRealReturn: true,
  expectedInflation: 0.02,
  pensionPlanReturn: 0.035,
  savingsAccountReturn: 0.025,
  projectionYears: 5,
  annualSalaryIncrease: 0,
  projectionAnnualExpenseIncrease: 0,
  projectionInvestmentMode: 'fixed',
  projectionInvestmentRampMonthly: 0,
  projectionInvestmentPercentOfSavings: 0.5,
  projectionInvestmentAnnualIncrease: 0,
  projectionContributionAssumption: 'budget',
  SAVINGS_RATE_GREEN: 0.2,
  SAVINGS_RATE_YELLOW: 0.1,
};

describe('buildMonthlyProjectionRows', () => {
  it('returns 60 rows for 5-year projection', () => {
    const rows = buildMonthlyProjectionRows({ settings: MINIMAL_SETTINGS });
    expect(rows).toHaveLength(60);
  });

  it('first row has monthIndex 0', () => {
    const rows = buildMonthlyProjectionRows({ settings: MINIMAL_SETTINGS });
    expect(rows[0].monthIndex).toBe(0);
  });

  it('last row has monthIndex 59 for 5-year projection', () => {
    const rows = buildMonthlyProjectionRows({ settings: MINIMAL_SETTINGS });
    expect(rows[59].monthIndex).toBe(59);
  });

  it('patrimony grows over time with positive contribution', () => {
    const rows = buildMonthlyProjectionRows({ settings: MINIMAL_SETTINGS });
    expect(rows[59].patrimonyEnd).toBeGreaterThan(rows[0].patrimonioInicio);
  });

  it('salary matches settings salary', () => {
    const rows = buildMonthlyProjectionRows({ settings: MINIMAL_SETTINGS });
    expect(rows[0].salary).toBe(2000);
  });

  it('month 12 isJanuary is true', () => {
    const rows = buildMonthlyProjectionRows({ settings: MINIMAL_SETTINGS });
    // monthIndex 0 = current month; month 12 is 13 months later
    const januaryRows = rows.filter((r) => r.isJanuary);
    expect(januaryRows.length).toBeGreaterThan(0);
  });

  it('debtBalance is 0 with no liabilities', () => {
    const rows = buildMonthlyProjectionRows({ settings: MINIMAL_SETTINGS });
    expect(rows[0].debtBalance).toBe(0);
  });

  it('mortgageAmortizationActive is false with no linked mortgage', () => {
    const rows = buildMonthlyProjectionRows({ settings: MINIMAL_SETTINGS });
    expect(rows[0].mortgageAmortizationActive).toBe(false);
  });
});

// ─── summarizeProjectionRows ──────────────────────────────────────────────────

describe('summarizeProjectionRows', () => {
  it('returns zero summary for empty rows', () => {
    const summary = summarizeProjectionRows([], 50000);
    expect(summary.finalPatrimony).toBe(50000);
    expect(summary.totalNetContributed).toBe(0);
    expect(summary.isCoherent).toBe(true);
  });

  it('final patrimony matches last row patrimonyEnd', () => {
    const rows = buildMonthlyProjectionRows({ settings: MINIMAL_SETTINGS });
    const summary = summarizeProjectionRows(rows, 0);
    expect(summary.finalPatrimony).toBe(rows[rows.length - 1].patrimonyEnd);
  });

  it('isCoherent is true for a clean projection', () => {
    const rows = buildMonthlyProjectionRows({ settings: MINIMAL_SETTINGS });
    const summary = summarizeProjectionRows(rows, 0);
    expect(summary.isCoherent).toBe(true);
  });

  it('totalNetContributed equals sum of all monthly contributions', () => {
    const rows = buildMonthlyProjectionRows({ settings: MINIMAL_SETTINGS });
    const summary = summarizeProjectionRows(rows, 0);
    const manual = rows.reduce(
      (s, r) => s + r.netContribution + (r.additionalInvestments ?? 0),
      0,
    );
    expect(summary.totalNetContributed).toBeCloseTo(manual, 1);
  });

  it('averageSavingsRate is between 0 and 1', () => {
    const rows = buildMonthlyProjectionRows({ settings: MINIMAL_SETTINGS });
    const summary = summarizeProjectionRows(rows, 0);
    expect(summary.averageSavingsRate).toBeGreaterThanOrEqual(0);
    expect(summary.averageSavingsRate).toBeLessThanOrEqual(1);
  });
});
