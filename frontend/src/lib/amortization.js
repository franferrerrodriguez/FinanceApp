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
 * Builds full amortization schedule using French method
 * (constant installment) — standard for Spanish mortgages.
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
 * Calculates the impact of a one-time early repayment.
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
 * Calculates impact of recurring extra monthly payment.
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
