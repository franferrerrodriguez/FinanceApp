/**
 * Money arithmetic in integer cents to avoid floating-point errors.
 * Amounts in state/UI stay in euros; critical operations go through here.
 */

export const CENTS_PER_EURO = 100;

/** Convert euros to cents (round to nearest cent, half-up). */
export function toCents(euros) {
  const n = Number(euros);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * CENTS_PER_EURO);
}

/** Convert cents to euros (cent-precision number). */
export function fromCents(cents) {
  return cents / CENTS_PER_EURO;
}

/** Normalize a euro value after user input or intermediate calculation. */
export function normalizeEuros(euros) {
  return fromCents(toCents(euros));
}

export function clampPercent(percent, min = 1, max = 100) {
  const p = Number(percent);
  if (!Number.isFinite(p)) return 50;
  return Math.min(max, Math.max(min, Math.round(p)));
}

/** Proportional share in cents (half-up to the cent). */
export function shareCents(totalCents, percent) {
  if (totalCents <= 0) return 0;
  const pct = clampPercent(percent);
  return Math.round((totalCents * pct) / 100);
}

/**
 * Your share of a shared expense, in euros.
 * @param {number} totalEuros - Total expense amount
 * @param {boolean} shared - Whether the expense is split
 * @param {number} percent - Your share percentage (1–100)
 */
export function applyShareEuros(totalEuros, shared, percent) {
  const totalCents = toCents(totalEuros);
  if (!shared || totalCents <= 0) return fromCents(totalCents);
  return fromCents(shareCents(totalCents, percent));
}

/** Sum euro amounts, result normalized to the cent. */
export function sumEuros(...amounts) {
  const totalCents = amounts.reduce((acc, e) => acc + toCents(e), 0);
  return fromCents(totalCents);
}

/** Subtract in euros: minuend − subtrahends, normalized to the cent. */
export function subtractEuros(minuend, ...subtrahends) {
  const resultCents =
    toCents(minuend) -
    subtrahends.reduce((acc, s) => acc + toCents(s), 0);
  return fromCents(resultCents);
}

/** Parse money input text and return normalized euros (≥ 0). */
export function parseMoneyEuros(raw) {
  const n = parseFloat(String(raw).replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return 0;
  return normalizeEuros(n);
}

/** Parse money input allowing negative values (gain/loss). */
export function parseSignedMoneyEuros(raw) {
  const cleaned = String(raw).trim().replace(',', '.');
  const n = parseFloat(cleaned);
  if (!Number.isFinite(n)) return null;
  return normalizeEuros(n);
}

/**
 * Split a total in cents by integer weights (e.g. 40, 35, 15, 10).
 * Uses largest remainder so parts sum exactly to the total.
 */
export function allocateCents(totalCents, weights) {
  if (!weights.length) return [];
  if (totalCents <= 0) return weights.map(() => 0);

  const sumW = weights.reduce((acc, w) => acc + w, 0);
  if (sumW <= 0) return weights.map(() => 0);

  const exact = weights.map((w) => (totalCents * w) / sumW);
  const floors = exact.map((x) => Math.floor(x));
  let remainder = totalCents - floors.reduce((a, b) => a + b, 0);

  const order = exact
    .map((value, index) => ({ index, remainder: value - floors[index] }))
    .sort((a, b) => b.remainder - a.remainder);

  const result = [...floors];
  for (let i = 0; i < remainder; i++) {
    result[order[i % order.length].index] += 1;
  }
  return result;
}

/** Split euros by weights; returns array of normalized euro amounts. */
export function allocateEurosByWeights(totalEuros, weights) {
  return allocateCents(toCents(totalEuros), weights).map(fromCents);
}
