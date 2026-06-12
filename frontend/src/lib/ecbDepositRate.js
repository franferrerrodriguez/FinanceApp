/** ECB Data Portal — tipo depósito (facility rate), nivel diario. */
export const ECB_DEPOSIT_RATE_SERIES = 'D.U2.EUR.4F.KR.DFR.LEV';

export const ECB_DEPOSIT_RATE_SOURCE_URL =
  'https://data.ecb.europa.eu/data/datasets/FM/FM.D.U2.EUR.4F.KR.DFR.LEV';

const ECB_API_BASE = 'https://data-api.ecb.europa.eu/service/data/FM';
const CACHE_KEY = 'financia_ecb_deposit_rate_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_HISTORY_MONTHS = 24;
const DEFAULT_DAILY_OBSERVATIONS = 750;

export function buildEcbDepositRateSeriesUrl(
  seriesKey = ECB_DEPOSIT_RATE_SERIES,
  nObs = DEFAULT_DAILY_OBSERVATIONS,
) {
  const params = new URLSearchParams({
    lastNObservations: String(nObs),
    detail: 'dataonly',
    format: 'jsondata',
  });
  return `${ECB_API_BASE}/${seriesKey}?${params}`;
}

function parseEcbDailyPoint(percent, periodId) {
  if (!Number.isFinite(percent)) return null;
  const match = String(periodId ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return null;
  return {
    year,
    month,
    day,
    percent,
    rate: Math.round(percent * 10000) / 1000000,
    periodCode: `M${month}`,
  };
}

/** Daily deposit-facility points from ECB SDMX-JSON. */
export function parseEcbDepositDailyHistory(json) {
  const observations = Object.values(json?.dataSets?.[0]?.series ?? {})[0]
    ?.observations;
  const timeValues =
    json?.structure?.dimensions?.observation?.find(
      (dimension) => dimension.id === 'TIME_PERIOD',
    )?.values ?? [];
  if (!observations || !timeValues.length) return [];

  return Object.entries(observations)
    .map(([index, row]) => {
      const period = timeValues[Number(index)];
      const percent = Array.isArray(row) ? row[0] : null;
      return parseEcbDailyPoint(percent, period?.id ?? period?.name);
    })
    .filter(Boolean);
}

/** Last daily observation per calendar month (stepwise policy rate). */
export function aggregateEcbDailyToMonthly(
  dailyHistory = [],
  maxMonths = DEFAULT_HISTORY_MONTHS,
) {
  const byMonth = new Map();
  for (const point of dailyHistory) {
    const key = `${point.year}-${String(point.month).padStart(2, '0')}`;
    const existing = byMonth.get(key);
    if (!existing || point.day >= existing.day) {
      byMonth.set(key, point);
    }
  }
  return [...byMonth.values()]
    .sort(
      (a, b) =>
        a.year - b.year || a.month - b.month || a.day - b.day,
    )
    .slice(-maxMonths);
}

export function parseEcbDepositRateBundle(json, maxMonths = DEFAULT_HISTORY_MONTHS) {
  const dailyHistory = parseEcbDepositDailyHistory(json);
  const history = aggregateEcbDailyToMonthly(dailyHistory, maxMonths);
  const latest = history.length ? history[history.length - 1] : null;
  const seriesName =
    json?.structure?.attributes?.series
      ?.find((attribute) => attribute.id === 'TITLE')
      ?.values?.[0]?.name?.trim() ?? 'Tipo depósito BCE';

  return {
    latest: latest
      ? {
          seriesKey: ECB_DEPOSIT_RATE_SERIES,
          seriesName,
          fetchedAt: Date.now(),
          ...latest,
        }
      : null,
    history,
  };
}

function readCache({ ignoreExpiry = false } = {}) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.cachedAt) return null;
    if (!ignoreExpiry && Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getCachedEcbDepositRateLatest() {
  const cached = readCache() ?? readCache({ ignoreExpiry: true });
  return cached?.latest ?? null;
}

export function getCachedEcbDepositRateHistory() {
  const cached = readCache() ?? readCache({ ignoreExpiry: true });
  return cached?.history ?? [];
}

function writeCache(bundle) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        cachedAt: Date.now(),
        latest: bundle.latest,
        history: bundle.history,
      }),
    );
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * @param {{ force?: boolean, maxMonths?: number, fetchImpl?: typeof fetch }} [options]
 */
export async function fetchEcbDepositRateBundle(options = {}) {
  const {
    force = false,
    maxMonths = DEFAULT_HISTORY_MONTHS,
    fetchImpl = fetch,
  } = options;

  if (!force) {
    const cached = readCache();
    if (cached?.latest) {
      return {
        latest: cached.latest,
        history: cached.history ?? [],
        fromCache: true,
      };
    }
  }

  const response = await fetchImpl(buildEcbDepositRateSeriesUrl(), {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`ecb_http_${response.status}`);
  }

  const json = await response.json();
  const bundle = parseEcbDepositRateBundle(json, maxMonths);
  if (!bundle.latest) throw new Error('ecb_empty_data');

  writeCache(bundle);
  return { ...bundle, fromCache: false };
}
