import assert from 'node:assert/strict';
import {
  INE_IPC_ANNUAL_SERIES,
  buildIneIpcChartPoints,
  buildIneIpcSeriesUrl,
  parseIneIpcAnnualResponse,
  parseIneIpcBundle,
  parseIneIpcHistory,
  parseInePeriodCode,
} from './ineInflation.js';

assert.equal(
  buildIneIpcSeriesUrl(),
  `https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE/${INE_IPC_ANNUAL_SERIES}?nult=24&tip=AM`,
);

assert.deepEqual(parseInePeriodCode('M12', 2025), { month: 12, year: 2025 });

const parsed = parseIneIpcAnnualResponse({
  COD: 'IPC251856',
  Nombre: 'Nacional. Índice general. Variación anual. ',
  Data: [
    {
      Fecha: '2025-11-01T00:00:00.000+01:00',
      T3_TipoDato: 'Definitivo',
      T3_Periodo: 'M11',
      Anyo: 2025,
      Valor: 3.0,
    },
    {
      Fecha: '2025-12-01T00:00:00.000+01:00',
      T3_TipoDato: 'Definitivo',
      T3_Periodo: 'M12',
      Anyo: 2025,
      Valor: 2.9,
    },
  ],
});

assert.equal(parsed.percent, 2.9);
assert.equal(parsed.rate, 0.029);
assert.equal(parsed.month, 12);
assert.equal(parsed.year, 2025);

assert.equal(parseIneIpcAnnualResponse({ Data: [] }), null);

const sample = {
  COD: 'IPC251856',
  Nombre: 'Nacional. Índice general. Variación anual. ',
  Data: [
    { T3_Periodo: 'M11', Anyo: 2025, Valor: 3.0, T3_TipoDato: 'Definitivo' },
    { T3_Periodo: 'M12', Anyo: 2025, Valor: 2.9, T3_TipoDato: 'Definitivo' },
  ],
};
assert.equal(parseIneIpcHistory(sample).length, 2);
assert.equal(parseIneIpcBundle(sample).latest.percent, 2.9);
assert.equal(buildIneIpcChartPoints(parseIneIpcHistory(sample)).length, 2);

console.log('ineInflation.test.js: ok');
