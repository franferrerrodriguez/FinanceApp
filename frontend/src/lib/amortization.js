/** @typedef {import('../types/calculations.js').AmortizationRow} AmortizationRow */
/** @typedef {import('../types/calculations.js').AmortizationSummary} AmortizationSummary */
/** @typedef {import('../types/calculations.js').AmortizationSavings} AmortizationSavings */

import { fromCents, roundMoney, toCents } from './money.js';

/**
 * Monthly rate for Spanish mortgages: TIN / 12 (tipo nominal mensual).
 * Bank receipts use: intereses = capital pendiente × TIN / 12.
 */
export function monthlyRate(annualRate) {
  return annualRate / 12;
}

/** Intereses del mes en céntimos: saldo × TIN / 12 (redondeo al céntimo). */
export function calcMonthlyInterestCents(balanceCents, annualRate) {
  if (annualRate <= 0 || balanceCents <= 0) return 0;
  return Math.round((balanceCents * annualRate) / 12);
}

/** First payment date: last day of the current calendar month. */
export function getScheduleStartDate(fromDate = new Date()) {
  const year = fromDate.getFullYear();
  const month = fromDate.getMonth() + 1;
  return new Date(year, month, 0);
}

function paymentDateForMonth(startDate, monthIndex) {
  const d = addMonths(startDate, monthIndex - 1);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function scheduleToSummary(schedule, monthlyPayment) {
  const totalInterest = schedule.reduce((s, row) => s + row.interest, 0);
  const totalPrincipal = schedule.reduce((s, row) => s + row.principal, 0);
  const last = schedule[schedule.length - 1];
  return {
    schedule,
    months: schedule.length,
    totalInterest: roundMoney(totalInterest),
    totalPrincipal: roundMoney(totalPrincipal),
    totalPaid: roundMoney(totalInterest + totalPrincipal),
    monthlyPayment,
    endDate: last?.date ?? null,
  };
}

/**
 * Builds a full amortization schedule using the French method
 * (constant installment) — standard for Spanish mortgages.
 *
 * @param {number} remainingCapital - Outstanding principal in EUR
 * @param {number} annualRate - Annual interest rate as a decimal (e.g. 0.025)
 * @param {number} monthlyPayment - Fixed monthly installment in EUR
 * @param {{ startDate?: Date; initialLumpSum?: number }} [options]
 * @returns {AmortizationRow[]}
 */
export function buildAmortizationSchedule(
  remainingCapital,
  annualRate,
  monthlyPayment,
  options = {},
) {
  const { startDate = getScheduleStartDate(), initialLumpSum = 0 } = options;
  const paymentCents = toCents(monthlyPayment);
  const schedule = [];
  let balanceCents = toCents(
    Math.max(0, remainingCapital - initialLumpSum),
  );
  let month = 0;

  while (balanceCents > 0 && month < 600) {
    month++;
    const startBalanceCents = balanceCents;
    const interestCents = calcMonthlyInterestCents(balanceCents, annualRate);
    let principalCents =
      annualRate > 0 ? paymentCents - interestCents : paymentCents;
    if (principalCents < 0) principalCents = 0;
    if (principalCents > balanceCents) principalCents = balanceCents;
    balanceCents -= principalCents;

    schedule.push({
      month,
      date: paymentDateForMonth(startDate, month),
      startBalance: fromCents(startBalanceCents),
      payment: fromCents(interestCents + principalCents),
      interest: fromCents(interestCents),
      principal: fromCents(principalCents),
      balance: fromCents(balanceCents),
    });
  }

  return schedule;
}

/**
 * Resolves baseline schedule and optional early-repayment scenario.
 *
 * @param {{ remainingCapital: number; annualRate: number; monthlyPayment: number; startDate?: Date; scenario?: { type: 'lump' | 'recurring'; extraPayment?: number; extraMonthly?: number; mode?: 'reduce_term' | 'reduce_payment' } | null }} params
 * @returns {{ baseline: AmortizationSummary; scenario: AmortizationSummary | null; savings: AmortizationSavings | null; impliedReturn: number }}
 */
export function resolveMortgageAmortization({
  remainingCapital,
  annualRate,
  monthlyPayment,
  startDate,
  scenario = null,
}) {
  const start = startDate ?? getScheduleStartDate();
  const baselineSchedule = buildAmortizationSchedule(
    remainingCapital,
    annualRate,
    monthlyPayment,
    { startDate: start },
  );
  const baseline = scheduleToSummary(baselineSchedule, monthlyPayment);

  if (!scenario) {
    return { baseline, scenario: null, savings: null, impliedReturn: annualRate };
  }

  if (scenario.type === 'lump' && scenario.extraPayment > 0) {
    const comparison = calcLumpSumRepayment({
      remainingCapital,
      annualRate,
      monthlyPayment,
      extraPayment: scenario.extraPayment,
      mode: scenario.mode ?? 'reduce_term',
      startDate: start,
    });
    return {
      baseline: comparison.current,
      scenario: comparison.after,
      savings: comparison.savings,
      impliedReturn: annualRate,
    };
  }

  if (scenario.type === 'recurring' && scenario.extraMonthly > 0) {
    const comparison = calcRecurringExtraPayment({
      remainingCapital,
      annualRate,
      monthlyPayment,
      extraMonthly: scenario.extraMonthly,
      startDate: start,
    });
    return {
      baseline: comparison.current,
      scenario: comparison.after,
      savings: comparison.savings,
      impliedReturn: annualRate,
    };
  }

  return { baseline, scenario: null, savings: null, impliedReturn: annualRate };
}

/**
 * Calculates the impact of a one-time early repayment (amortización anticipada parcial).
 *
 * @param {{ remainingCapital: number; annualRate: number; monthlyPayment: number; extraPayment: number; mode: 'reduce_term' | 'reduce_payment'; startDate?: Date }} params
 * @returns {{ current: AmortizationSummary; after: AmortizationSummary; savings: AmortizationSavings; impliedReturn: number }}
 */
export function calcLumpSumRepayment({
  remainingCapital,
  annualRate,
  monthlyPayment,
  extraPayment,
  mode,
  startDate,
}) {
  const start = startDate ?? getScheduleStartDate();
  const r = monthlyRate(annualRate);

  const currentSchedule = buildAmortizationSchedule(
    remainingCapital,
    annualRate,
    monthlyPayment,
    { startDate: start },
  );
  const current = scheduleToSummary(currentSchedule, monthlyPayment);

  const newCapital = Math.max(0, remainingCapital - extraPayment);

  let afterSchedule;
  let afterMonthlyPayment;

  if (mode === 'reduce_term') {
    afterMonthlyPayment = monthlyPayment;
    afterSchedule = buildAmortizationSchedule(
      newCapital,
      annualRate,
      monthlyPayment,
      { startDate: start },
    );
  } else {
    afterMonthlyPayment =
      r > 0
        ? (newCapital * r) / (1 - Math.pow(1 + r, -current.months))
        : newCapital / current.months;
    afterSchedule = buildAmortizationSchedule(
      newCapital,
      annualRate,
      afterMonthlyPayment,
      { startDate: start },
    );
  }

  const after = scheduleToSummary(afterSchedule, roundMoney(afterMonthlyPayment));
  const monthsSaved = current.months - after.months;
  const interestSaved = current.totalInterest - after.totalInterest;

  return {
    current,
    after,
    savings: {
      months: monthsSaved,
      years: Math.floor(monthsSaved / 12),
      interest: roundMoney(interestSaved),
    },
    impliedReturn: annualRate,
  };
}

/**
 * Calculates the impact of a recurring extra monthly payment on mortgage term.
 *
 * @param {{ remainingCapital: number; annualRate: number; monthlyPayment: number; extraMonthly: number; startDate?: Date }} params
 * @returns {{ current: AmortizationSummary; after: AmortizationSummary; savings: AmortizationSavings; impliedReturn: number }}
 */
export function calcRecurringExtraPayment({
  remainingCapital,
  annualRate,
  monthlyPayment,
  extraMonthly,
  startDate,
}) {
  const start = startDate ?? getScheduleStartDate();
  const newPayment = monthlyPayment + extraMonthly;

  const currentSchedule = buildAmortizationSchedule(
    remainingCapital,
    annualRate,
    monthlyPayment,
    { startDate: start },
  );
  const afterSchedule = buildAmortizationSchedule(
    remainingCapital,
    annualRate,
    newPayment,
    { startDate: start },
  );

  const current = scheduleToSummary(currentSchedule, monthlyPayment);
  const after = scheduleToSummary(afterSchedule, newPayment);
  const monthsSaved = current.months - after.months;
  const totalExtraPaid = extraMonthly * after.months;

  return {
    current,
    after,
    savings: {
      months: monthsSaved,
      years: Math.floor(monthsSaved / 12),
      interest: roundMoney(current.totalInterest - after.totalInterest),
      totalExtraPaid: roundMoney(totalExtraPaid),
    },
    impliedReturn: annualRate,
  };
}

export function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
