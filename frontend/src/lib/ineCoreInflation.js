/** INE open data API — IPC subyacente nacional, variación anual (base 2025). */
import {
  buildIneIpcSeriesUrl,
  parseIneIpcBundle,
} from './ineInflation.js';

export const INE_IPC_CORE_ANNUAL_SERIES = 'IPC292510';

export const INE_IPC_CORE_SOURCE_URL =
  'https://www.ine.es/jaxiT3/Tabla.htm?t=76130';

const CACHE_KEY = 'financia_ine_ipc_core_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_HISTORY_MONTHS = 24;

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

export function getCachedIneIpcCoreLatest() {
  const cached = readCache() ?? readCache({ ignoreExpiry: true });
  return cached?.latest ?? null;
}

export function getCachedIneIpcCoreHistory() {
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
export async function fetchIneIpcCoreBundle(options = {}) {
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
    buildIneIpcSeriesUrl(INE_IPC_CORE_ANNUAL_SERIES, nult),
    { headers: { Accept: 'application/json' } },
  );

  if (!response.ok) {
    throw new Error(`ine_http_${response.status}`);
  }

  const json = await response.json();
  const bundle = parseIneIpcBundle(json);
  if (!bundle.latest) throw new Error('ine_empty_data');

  writeCache(bundle);
  return { ...bundle, fromCache: false };
}
