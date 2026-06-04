import assert from 'node:assert/strict';
import { getEmergencyFundAlert } from './emergencyFund.js';

const belowTarget = {
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

const critical = { ...belowTarget, status: 'danger', monthsCovered: 0.5, liquid: 500 };
assert.equal(getEmergencyFundAlert(critical).id, 'emergency_fund_critical');

const ok = { ...belowTarget, liquid: 7000, shortfall: 0, status: 'good' };
assert.equal(getEmergencyFundAlert(ok), null);

assert.equal(
  getEmergencyFundAlert({ hasSnapshots: false, targetAmount: 0, monthlyExpenses: 0 })
    ?.id,
  'emergency_fund_no_data',
);

console.log('emergencyFund.test.js: ok');
