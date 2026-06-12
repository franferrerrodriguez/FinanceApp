import assert from 'node:assert/strict';
import { INE_IPC_CORE_ANNUAL_SERIES } from './ineCoreInflation.js';
import { buildIneIpcSeriesUrl, parseIneIpcBundle } from './ineInflation.js';

assert.equal(INE_IPC_CORE_ANNUAL_SERIES, 'IPC292510');
assert.equal(
  buildIneIpcSeriesUrl(INE_IPC_CORE_ANNUAL_SERIES, 24),
  `https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/${INE_IPC_CORE_ANNUAL_SERIES}?nult=24&tip=AM`,
);

const sample = {
  COD: INE_IPC_CORE_ANNUAL_SERIES,
  Nombre:
    'Nacional. Subyacente: General sin alimentos no elaborados ni productos energéticos. Variación anual. ',
  Data: [
    { T3_Periodo: 'M03', Anyo: 2026, Valor: 2.7, T3_TipoDato: 'Definitivo' },
    { T3_Periodo: 'M04', Anyo: 2026, Valor: 2.8, T3_TipoDato: 'Definitivo' },
  ],
};

const bundle = parseIneIpcBundle(sample);
assert.equal(bundle.latest.percent, 2.8);
assert.equal(bundle.latest.rate, 0.028);
assert.equal(bundle.history.length, 2);

console.log('ineCoreInflation.test.js: ok');
