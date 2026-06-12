import assert from 'node:assert/strict';
import {
  ECB_DEPOSIT_RATE_SERIES,
  aggregateEcbDailyToMonthly,
  buildEcbDepositRateSeriesUrl,
  parseEcbDepositDailyHistory,
  parseEcbDepositRateBundle,
} from './ecbDepositRate.js';

assert.match(
  buildEcbDepositRateSeriesUrl(),
  new RegExp(
    `^https://data-api\\.ecb\\.europa\\.eu/service/data/FM/${ECB_DEPOSIT_RATE_SERIES.replace('.', '\\.')}\\?`,
  ),
);

const sample = {
  structure: {
    dimensions: {
      observation: [
        {
          id: 'TIME_PERIOD',
          values: [
            { id: '2026-03-15', name: '2026-03-15' },
            { id: '2026-03-31', name: '2026-03-31' },
            { id: '2026-04-10', name: '2026-04-10' },
          ],
        },
      ],
    },
    attributes: {
      series: [{ id: 'TITLE', values: [{ name: 'Deposit facility' }] }],
    },
  },
  dataSets: [
    {
      series: {
        '0:0:0:0:0:0:0': {
          observations: {
            0: [2.5],
            1: [2],
            2: [2],
          },
        },
      },
    },
  ],
};

const daily = parseEcbDepositDailyHistory(sample);
assert.equal(daily.length, 3);
assert.equal(daily[1].percent, 2);
assert.equal(daily[1].month, 3);
assert.equal(daily[1].day, 31);

const monthly = aggregateEcbDailyToMonthly(daily);
assert.equal(monthly.length, 2);
assert.equal(monthly[0].percent, 2);
assert.equal(monthly[0].month, 3);
assert.equal(monthly[1].month, 4);

const bundle = parseEcbDepositRateBundle(sample);
assert.equal(bundle.latest.percent, 2);
assert.equal(bundle.latest.seriesName, 'Deposit facility');

console.log('ecbDepositRate.test.js: ok');
