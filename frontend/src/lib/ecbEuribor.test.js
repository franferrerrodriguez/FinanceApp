import assert from 'node:assert/strict';
import {
  ECB_EURIBOR_12M_SERIES,
  buildEcbEuriborSeriesUrl,
  parseEcbEuriborBundle,
  parseEcbEuriborHistory,
} from './ecbEuribor.js';

assert.match(
  buildEcbEuriborSeriesUrl(),
  new RegExp(
    `^https://data-api\\.ecb\\.europa\\.eu/service/data/FM/${ECB_EURIBOR_12M_SERIES.replace('.', '\\.')}\\?`,
  ),
);

const sample = {
  structure: {
    dimensions: {
      observation: [
        {
          id: 'TIME_PERIOD',
          values: [
            { id: '2026-03', name: '2026-03' },
            { id: '2026-04', name: '2026-04' },
          ],
        },
      ],
    },
    attributes: {
      series: [{ id: 'TITLE', values: [{ name: 'Euribor 1-year' }] }],
    },
  },
  dataSets: [
    {
      series: {
        '0:0:0:0:0:0:0': {
          observations: {
            0: [2.5651364],
            1: [2.7468],
          },
        },
      },
    },
  ],
};

const history = parseEcbEuriborHistory(sample);
assert.equal(history.length, 2);
assert.equal(history[0].month, 3);
assert.equal(history[0].year, 2026);
assert.equal(history[0].percent, 2.5651364);
assert.equal(history[0].rate, 0.025651);
assert.equal(history[1].percent, 2.7468);

const bundle = parseEcbEuriborBundle(sample);
assert.equal(bundle.latest.percent, 2.7468);
assert.equal(bundle.latest.seriesName, 'Euribor 1-year');

assert.equal(parseEcbEuriborHistory({ dataSets: [] }).length, 0);

console.log('ecbEuribor.test.js: ok');
