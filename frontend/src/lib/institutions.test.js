import assert from 'node:assert/strict';
import {
  formatInstitutionLabel,
  INSTITUTION_OTHER_ID,
  institutionStorageValue,
  resolveInstitutionSelection,
} from './institutions.js';
import { SPANISH_BANK_IDS, SPANISH_BANK_LEGACY_LABELS } from './spanishBanks.js';

const t = (key) => key;

assert.deepEqual(
  resolveInstitutionSelection('bbva', SPANISH_BANK_IDS, SPANISH_BANK_LEGACY_LABELS),
  { key: 'bbva', custom: '' },
);

assert.deepEqual(
  resolveInstitutionSelection('BBVA', SPANISH_BANK_IDS, SPANISH_BANK_LEGACY_LABELS),
  { key: 'bbva', custom: '' },
);

assert.deepEqual(
  resolveInstitutionSelection('Trade Republic', SPANISH_BANK_IDS, SPANISH_BANK_LEGACY_LABELS),
  { key: 'tradeRepublic', custom: '' },
);

assert.deepEqual(
  resolveInstitutionSelection('Cooperativa local', SPANISH_BANK_IDS, SPANISH_BANK_LEGACY_LABELS),
  { key: INSTITUTION_OTHER_ID, custom: 'Cooperativa local' },
);

assert.equal(institutionStorageValue('bbva', ''), 'bbva');
assert.equal(institutionStorageValue(INSTITUTION_OTHER_ID, '  Mi banco  '), 'Mi banco');

assert.equal(
  formatInstitutionLabel('bbva', SPANISH_BANK_IDS, t, 'balance.banks', SPANISH_BANK_LEGACY_LABELS),
  'balance.banks.bbva',
);

console.log('institutions.test.js OK');
