import { describe, it, expect } from 'vitest';
import {
  createAnnualExpense,
  getAnnualExpensesYearlyTotal,
  getAnnualExpensesMonthlyAverage,
  getPunctualExpensesForDate,
} from './annualExpenses.js';

describe('createAnnualExpense', () => {
  it('creates with defaults', () => {
    const expense = createAnnualExpense({});
    expect(expense.id).toBeDefined();
    expect(expense.name).toBe('');
    expect(expense.amount).toBe(0);
    expect(expense.month).toBe(1);
  });

  it('normalizes amount (clamps to 0)', () => {
    expect(createAnnualExpense({ amount: -100 }).amount).toBe(0);
  });

  it('clamps month between 1 and 12', () => {
    expect(createAnnualExpense({ month: 0 }).month).toBe(1);
    expect(createAnnualExpense({ month: 13 }).month).toBe(12);
  });

  it('rounds month to integer', () => {
    expect(createAnnualExpense({ month: 6.7 }).month).toBe(7);
  });

  it('preserves valid fields', () => {
    const e = createAnnualExpense({ name: 'Car ITV', amount: 60, month: 4 });
    expect(e.name).toBe('Car ITV');
    expect(e.amount).toBe(60);
    expect(e.month).toBe(4);
  });
});

describe('getAnnualExpensesYearlyTotal', () => {
  it('sums all amounts', () => {
    const expenses = [
      { amount: 300 },
      { amount: 120 },
      { amount: 80 },
    ];
    expect(getAnnualExpensesYearlyTotal(expenses)).toBe(500);
  });

  it('returns 0 for empty array', () => {
    expect(getAnnualExpensesYearlyTotal([])).toBe(0);
  });

  it('handles undefined amount fields', () => {
    expect(getAnnualExpensesYearlyTotal([{ amount: undefined }])).toBe(0);
  });
});

describe('getAnnualExpensesMonthlyAverage', () => {
  it('divides yearly total by 12', () => {
    const expenses = [{ amount: 1200 }];
    expect(getAnnualExpensesMonthlyAverage(expenses)).toBe(100);
  });

  it('returns 0 for empty array', () => {
    expect(getAnnualExpensesMonthlyAverage([])).toBe(0);
  });
});

describe('getPunctualExpensesForDate', () => {
  it('returns sum of expenses for the matching calendar month', () => {
    const expenses = [
      { amount: 300, month: 4 },
      { amount: 150, month: 4 },
      { amount: 200, month: 6 },
    ];
    const april = new Date(2025, 3, 1); // April
    expect(getPunctualExpensesForDate(expenses, april)).toBe(450);
  });

  it('returns 0 for a month with no expenses', () => {
    const expenses = [{ amount: 300, month: 4 }];
    const jan = new Date(2025, 0, 1);
    expect(getPunctualExpensesForDate(expenses, jan)).toBe(0);
  });

  it('returns 0 for null date', () => {
    expect(getPunctualExpensesForDate([{ amount: 300, month: 1 }], null)).toBe(0);
  });

  it('returns 0 for empty expenses array', () => {
    expect(getPunctualExpensesForDate([], new Date())).toBe(0);
  });
});
