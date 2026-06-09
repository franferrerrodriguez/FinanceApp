import assert from 'node:assert/strict';
import { calcMonthlyExpenseBaseline, getEmergencyFundAlert } from './emergencyFund.js';

const belowTarget = {
  hasLiquidData: true,
  hasLiquidAssets: true,
  hasSnapshots: true,
  liquid: 2000,
  targetAmount: 6000,
  shortfall: 4000,
  monthsTarget: 6,
  monthsCovered: 2,
  monthlyExpenses: 1000,
  status: 'warn',
};

const alert = getEmergencyFundAlert(belowTarget);
assert.equal(alert.id, 'emergency_fund_below_target');
assert.equal(alert.severity, 'warn');
assert.equal(alert.params.shortfall, 4000);
assert.match(alert.href, /tab=patrimony/);

const critical = { ...belowTarget, status: 'danger', monthsCovered: 0.5, liquid: 500 };
assert.equal(getEmergencyFundAlert(critical).id, 'emergency_fund_critical');

const ok = { ...belowTarget, liquid: 7000, shortfall: 0, status: 'good' };
assert.equal(getEmergencyFundAlert(ok), null);

assert.equal(
  getEmergencyFundAlert({ targetAmount: 0, monthlyExpenses: 0 }),
  null,
);

const noAccounts = {
  hasLiquidData: false,
  hasLiquidAssets: false,
  targetAmount: 6000,
  monthlyExpenses: 1000,
};
assert.equal(getEmergencyFundAlert(noAccounts).id, 'emergency_fund_no_accounts');

const noBalances = {
  hasLiquidData: false,
  hasLiquidAssets: true,
  targetAmount: 6000,
  monthlyExpenses: 1000,
};
assert.equal(getEmergencyFundAlert(noBalances).id, 'emergency_fund_no_balances');

const baseSettings = {
  mortgageRentTotal: 500,
  householdFixedEstimate: 200,
  groceriesEstimate: 100,
  leisureEstimate: 300,
};
assert.equal(calcMonthlyExpenseBaseline(baseSettings), 1100);
assert.equal(
  calcMonthlyExpenseBaseline({
    ...baseSettings,
    monthlyBudgetInvestment: 200,
    emergencyFundCountsInvestment: false,
  }),
  1100,
);
assert.equal(
  calcMonthlyExpenseBaseline({
    ...baseSettings,
    monthlyBudgetInvestment: 200,
    emergencyFundCountsInvestment: true,
  }),
  1300,
);

console.log('emergencyFund.test.js: ok');
