/** ECB Data Portal — Euribor 12 meses (1-year), media mensual. */
export const ECB_EURIBOR_12M_SERIES = 'M.U2.EUR.RT.MM.EURIBOR1YD_.HSTA';

export const ECB_EURIBOR_SOURCE_URL =
  'https://data.ecb.europa.eu/data/datasets/FM/FM.M.U2.EUR.RT.MM.EURIBOR1YD_.HSTA';

const ECB_API_BASE = 'https://data-api.ecb.europa.eu/service/data/FM';
const CACHE_KEY = 'financia_ecb_euribor_12m_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_HISTORY_MONTHS = 24;

export function buildEcbEuriborSeriesUrl(
  seriesKey = ECB_EURIBOR_12M_SERIES,
  nult = DEFAULT_HISTORY_MONTHS,
) {
  const params = new URLSearchParams({
    lastNObservations: String(nult),
    detail: 'dataonly',
    format: 'jsondata',
  });
  return `${ECB_API_BASE}/${seriesKey}?${params}`;
}

function parseEcbTimePeriod(periodId) {
  const match = String(periodId ?? '').match(/^(\d{4})-(\d{2})$/);
  if (!match) return { month: null, year: null };
  return {
    year: Number(match[1]) || null,
    month: Number(match[2]) || null,
  };
}

function parseEcbEuriborPoint(percent, periodId) {
  if (!Number.isFinite(percent)) return null;
  const { month, year } = parseEcbTimePeriod(periodId);
  if (!month || !year) return null;
  return {
    month,
    year,
    percent,
    rate: Math.round(percent * 10000) / 1000000,
    periodCode: `M${month}`,
  };
}

/** Monthly Euribor points from ECB SDMX-JSON. */
export function parseEcbEuriborHistory(json) {
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
      return parseEcbEuriborPoint(percent, period?.id ?? period?.name);
    })
    .filter(Boolean);
}

export function parseEcbEuriborBundle(json) {
  const history = parseEcbEuriborHistory(json);
  const latest = history.length ? history[history.length - 1] : null;
  const seriesName =
    json?.structure?.attributes?.series
      ?.find((attribute) => attribute.id === 'TITLE')
      ?.values?.[0]?.name?.trim() ?? 'Euribor 12 meses';

  return {
    latest: latest
      ? {
          seriesKey: ECB_EURIBOR_12M_SERIES,
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

export function getCachedEcbEuriborLatest() {
  const cached = readCache() ?? readCache({ ignoreExpiry: true });
  return cached?.latest ?? null;
}

export function getCachedEcbEuriborHistory() {
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
 * @param {{ force?: boolean, nult?: number, fetchImpl?: typeof fetch }} [options]
 */
export async function fetchEcbEuriborBundle(options = {}) {
  const {
    force = false,
    nult = DEFAULT_HISTORY_MONTHS,
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

  const response = await fetchImpl(
    buildEcbEuriborSeriesUrl(ECB_EURIBOR_12M_SERIES, nult),
    { headers: { Accept: 'application/json' } },
  );

  if (!response.ok) {
    throw new Error(`ecb_http_${response.status}`);
  }

  const json = await response.json();
  const bundle = parseEcbEuriborBundle(json);
  if (!bundle.latest) throw new Error('ecb_empty_data');

  writeCache(bundle);
  return { ...bundle, fromCache: false };
}
