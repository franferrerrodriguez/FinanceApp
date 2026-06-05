/** INE open data API — IPC general nacional, variación anual (base 2025). */
export const INE_IPC_ANNUAL_SERIES = 'IPC251856';

export const INE_IPC_SOURCE_URL =
  'https://www.ine.es/dyngs/INEbase/es/operacion.htm?c=Estadistica_C&cid=1254736176802&menu=ultiDatos&idp=1254735976607';

const INE_API_BASE = 'https://servicios.ine.es/wstempus/js/ES/DATOS_SERIE';
const CACHE_KEY = 'financia_ine_ipc_v2';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_HISTORY_MONTHS = 24;

export function buildIneIpcSeriesUrl(
  seriesCode = INE_IPC_ANNUAL_SERIES,
  nult = DEFAULT_HISTORY_MONTHS,
) {
  return `${INE_API_BASE}/${seriesCode}?nult=${nult}&tip=AM`;
}

export function parseInePeriodCode(periodCode, year) {
  const month = Number(String(periodCode ?? '').replace(/^M/i, ''));
  return {
    month: Number.isFinite(month) && month > 0 ? month : null,
    year: Number(year) || null,
  };
}

function parseIneIpcPoint(row) {
  const percent = Number(row?.Valor);
  if (!Number.isFinite(percent)) return null;
  const { month, year } = parseInePeriodCode(row.T3_Periodo, row.Anyo);
  return {
    month,
    year,
    percent,
    rate: Math.round(percent * 10000) / 1000000,
    periodCode: row.T3_Periodo ?? null,
    dataType: row.T3_TipoDato ?? null,
  };
}

/** All monthly IPC annual-variation points from INE DATOS_SERIE JSON. */
export function parseIneIpcHistory(json) {
  const rows = json?.Data;
  if (!Array.isArray(rows)) return [];
  return rows.map(parseIneIpcPoint).filter(Boolean);
}

/** Latest IPC annual variation point from INE DATOS_SERIE JSON. */
export function parseIneIpcAnnualResponse(json) {
  const history = parseIneIpcHistory(json);
  if (!history.length) return null;
  const latest = history[history.length - 1];
  return {
    seriesCode: json.COD ?? INE_IPC_ANNUAL_SERIES,
    seriesName: json.Nombre?.trim() ?? '',
    ...latest,
    fetchedAt: Date.now(),
  };
}

export function parseIneIpcBundle(json) {
  const history = parseIneIpcHistory(json);
  const latest = history.length ? history[history.length - 1] : null;
  return {
    latest: latest
      ? {
          seriesCode: json.COD ?? INE_IPC_ANNUAL_SERIES,
          seriesName: json.Nombre?.trim() ?? '',
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

/** Last cached INE IPC point (for display). Falls back to stale cache if needed. */
export function getCachedIneIpcAnnual() {
  const cached = readCache() ?? readCache({ ignoreExpiry: true });
  return cached?.latest ?? null;
}

export function getCachedIneIpcHistory() {
  const cached = readCache() ?? readCache({ ignoreExpiry: true });
  return cached?.history ?? [];
}

/** Rate used in projection: INE latest if known, else persisted settings. */
export function resolveProjectionInflationRate(settings = {}) {
  const latest = getCachedIneIpcAnnual();
  if (latest?.rate != null) return latest.rate;
  return settings.expectedInflation ?? 0;
}

export function formatIneIpcPeriod(data, locale = 'es') {
  if (!data?.month || !data?.year) return '';
  try {
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      year: 'numeric',
    }).format(new Date(data.year, data.month - 1, 1));
  } catch {
    return `${data.month}/${data.year}`;
  }
}

/** Short month label for chart X axis. */
export function formatIneIpcMonthShort(data, locale = 'es') {
  if (!data?.month || !data?.year) return '';
  try {
    const month = new Intl.DateTimeFormat(locale, { month: 'short' }).format(
      new Date(data.year, data.month - 1, 1),
    );
    const year = String(data.year).slice(-2);
    return `${month} '${year}`;
  } catch {
    return `${data.month}/${data.year}`;
  }
}

/** Chronological points for the IPC line chart. */
export function buildIneIpcChartPoints(history = [], locale = 'es') {
  return history.map((point) => ({
    id: `${point.year}-${point.periodCode}`,
    label: formatIneIpcMonthShort(point, locale),
    period: formatIneIpcPeriod(point, locale),
    percent: point.percent,
    rate: point.rate,
  }));
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
export async function fetchIneIpcBundle(options = {}) {
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

  const response = await fetchImpl(buildIneIpcSeriesUrl(INE_IPC_ANNUAL_SERIES, nult), {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`ine_http_${response.status}`);
  }

  const json = await response.json();
  const bundle = parseIneIpcBundle(json);
  if (!bundle.latest) throw new Error('ine_empty_data');

  writeCache(bundle);
  return { ...bundle, fromCache: false };
}

/** @deprecated Use fetchIneIpcBundle */
export async function fetchLatestIneIpcAnnual(options = {}) {
  const bundle = await fetchIneIpcBundle(options);
  return { ...bundle.latest, fromCache: bundle.fromCache };
}
