import { calcMonthlyInterestCents } from './amortization.js';
import { getCurrentMonthKey } from './dashboardMetrics.js';
import {
  getLinkedMortgageLiability,
  getMortgageYourShareOutstandingBalance,
} from './housingLiability.js';
import { applyShareEuros, fromCents, roundMoney, toCents } from './money.js';

function mortgageRentTotal(settings) {
  return settings?.mortgageRentTotal ?? settings?.mortgageRent ?? 0;
}

function mortgagePaymentForProjection(settings) {
  return applyShareEuros(
    mortgageRentTotal(settings ?? {}),
    settings?.mortgageRentShared,
    settings?.mortgageRentYourSharePercent,
  );
}

export function resolveProjectionMortgage({
  settings = {},
  liabilities = [],
  snapshots = [],
  debtBalance = 0,
  monthKey = getCurrentMonthKey(),
}) {
  const liability = getLinkedMortgageLiability(liabilities, settings);
  if (!liability || debtBalance <= 0) {
    return {
      liability: null,
      canAmortize: false,
      monthlyPayment: 0,
      annualRate: null,
    };
  }

  const monthlyPayment = roundMoney(mortgagePaymentForProjection(settings));
  const annualRate =
    liability.interestRate != null && Number.isFinite(Number(liability.interestRate))
      ? Number(liability.interestRate)
      : null;

  const snapshotDebt = getMortgageYourShareOutstandingBalance(
    snapshots,
    liability,
    monthKey,
  );

  return {
    liability,
    canAmortize:
      debtBalance > 0 &&
      monthlyPayment > 0 &&
      annualRate != null &&
      annualRate >= 0,
    monthlyPayment,
    annualRate,
    snapshotDebt,
  };
}

/** One month: interest (expense), principal (debt reduction), new debt balance. */
export function calcMortgageMonthDelta(debtBalance, annualRate, monthlyPayment) {
  const balance = Math.max(0, debtBalance ?? 0);
  const payment = Math.max(0, monthlyPayment ?? 0);
  if (balance <= 0 || payment <= 0) {
    return {
      mortgagePayment: 0,
      mortgageInterest: 0,
      mortgagePrincipal: 0,
      debtBalanceEnd: balance,
    };
  }

  const interestCents = calcMonthlyInterestCents(toCents(balance), annualRate ?? 0);
  const mortgageInterest = fromCents(interestCents);
  const mortgagePrincipal = roundMoney(
    Math.min(balance, Math.max(0, payment - mortgageInterest)),
  );
  const mortgagePayment = roundMoney(
    mortgagePrincipal > 0 || mortgageInterest > 0
      ? mortgageInterest + mortgagePrincipal
      : payment,
  );

  return {
    mortgagePayment,
    mortgageInterest,
    mortgagePrincipal,
    debtBalanceEnd: roundMoney(Math.max(0, balance - mortgagePrincipal)),
  };
}
