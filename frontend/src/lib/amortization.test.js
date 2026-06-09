import assert from 'node:assert/strict';
import {
  buildAmortizationSchedule,
  calcLumpSumRepayment,
  calcRecurringExtraPayment,
  getScheduleStartDate,
  monthlyRate,
  resolveMortgageAmortization,
} from './amortization.js';

const juneStart = getScheduleStartDate(new Date(2026, 5, 9));
assert.equal(juneStart.getFullYear(), 2026);
assert.equal(juneStart.getMonth(), 5);
assert.equal(juneStart.getDate(), 30);

const schedule = buildAmortizationSchedule(100_000, 0.025, 500);

assert.ok(schedule.length > 0);
assert.ok(
  Math.abs(schedule[0].interest - 100_000 * monthlyRate(0.025)) < 0.02,
);
assert.ok(schedule[0].startBalance === 100_000);
assert.ok(schedule[0].date instanceof Date);
assert.ok(
  schedule[schedule.length - 1].balance === 0 ||
    schedule[schedule.length - 1].balance < 0.01,
);
const principalSum = schedule.reduce((s, row) => s + row.principal, 0);
assert.ok(Math.abs(principalSum - 100_000) < 1);
assert.ok(
  Math.abs(
    schedule[schedule.length - 1].payment -
      schedule[schedule.length - 1].principal -
      schedule[schedule.length - 1].interest,
  ) < 0.02,
);

const lumpTerm = calcLumpSumRepayment({
  remainingCapital: 100_000,
  annualRate: 0.025,
  monthlyPayment: 500,
  extraPayment: 10_000,
  mode: 'reduce_term',
});

assert.ok(lumpTerm.savings.months > 0);
assert.ok(lumpTerm.savings.interest > 0);
assert.equal(lumpTerm.after.monthlyPayment, 500);
assert.ok(lumpTerm.after.months < lumpTerm.current.months);
assert.ok(lumpTerm.current.schedule.length === lumpTerm.current.months);
assert.ok(lumpTerm.after.schedule.length === lumpTerm.after.months);

const lumpPayment = calcLumpSumRepayment({
  remainingCapital: 100_000,
  annualRate: 0.025,
  monthlyPayment: 500,
  extraPayment: 10_000,
  mode: 'reduce_payment',
});

assert.ok(
  Math.abs(lumpPayment.after.months - lumpPayment.current.months) <= 1,
);
assert.ok(lumpPayment.after.monthlyPayment < 500);
assert.ok(lumpPayment.savings.interest > 0);

const recurring = calcRecurringExtraPayment({
  remainingCapital: 100_000,
  annualRate: 0.025,
  monthlyPayment: 500,
  extraMonthly: 100,
});

assert.ok(recurring.savings.months > 0);
assert.equal(recurring.after.monthlyPayment, 600);
assert.ok(recurring.savings.interest > 0);

const zeroRateSchedule = buildAmortizationSchedule(60_000, 0, 500);
assert.ok(zeroRateSchedule.length > 0);
assert.equal(zeroRateSchedule[0].interest, 0);
assert.ok(
  zeroRateSchedule[zeroRateSchedule.length - 1].balance === 0 ||
    zeroRateSchedule[zeroRateSchedule.length - 1].balance < 0.01,
);

const bankRows = buildAmortizationSchedule(91_207.59, 0.0225, 517.81);
const bankExpected = [
  { interest: 171.01, principal: 346.8, balance: 90_860.79 },
  { interest: 170.36, principal: 347.45, balance: 90_513.34 },
  { interest: 169.71, principal: 348.1, balance: 90_165.24 },
  { interest: 169.06, principal: 348.75, balance: 89_816.49 },
  { interest: 168.41, principal: 349.4, balance: 89_467.09 },
];
for (let i = 0; i < bankExpected.length; i++) {
  const row = bankRows[i];
  const exp = bankExpected[i];
  assert.equal(row.interest, exp.interest, `month ${i + 1} interest`);
  assert.equal(row.principal, exp.principal, `month ${i + 1} principal`);
  assert.equal(row.balance, exp.balance, `month ${i + 1} balance`);
  assert.equal(row.payment, 517.81);
}

const resolved = resolveMortgageAmortization({
  remainingCapital: 100_000,
  annualRate: 0.025,
  monthlyPayment: 500,
  scenario: { type: 'lump', extraPayment: 5_000, mode: 'reduce_term' },
});
assert.ok(resolved.baseline.schedule.length > resolved.scenario.schedule.length);

console.log('amortization.test.js: ok');
