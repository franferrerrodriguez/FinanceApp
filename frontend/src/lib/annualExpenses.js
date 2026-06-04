import { sumEuros } from './money.js';

export function createAnnualExpense(partial = {}) {
  return {
    id: partial.id ?? crypto.randomUUID?.() ?? `ae-${Date.now()}`,
    name: partial.name ?? '',
    amount: Math.max(0, partial.amount ?? 0),
    month: Math.min(12, Math.max(1, Math.round(partial.month ?? 1))),
  };
}

export function getAnnualExpensesYearlyTotal(items = []) {
  return sumEuros(...items.map((e) => e.amount ?? 0));
}

export function getAnnualExpensesMonthlyAverage(items = []) {
  const total = getAnnualExpensesYearlyTotal(items);
  return total / 12;
}

/** Gastos puntuales que caen en el mes calendario de `date` (1–12). */
export function getPunctualExpensesForDate(items, date) {
  if (!date || !items?.length) return 0;
  const calendarMonth = date.getMonth() + 1;
  return sumEuros(
    ...items
      .filter((e) => e.month === calendarMonth)
      .map((e) => e.amount ?? 0),
  );
}
