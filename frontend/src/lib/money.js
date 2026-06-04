/**
 * Aritmética monetaria en céntimos (enteros) para evitar errores de coma flotante.
 * Los importes en estado/UI siguen en euros; las operaciones críticas pasan por aquí.
 */

export const CENTS_PER_EURO = 100;

/** Convierte euros a céntimos (redondeo al céntimo más cercano, half-up). */
export function toCents(euros) {
  const n = Number(euros);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * CENTS_PER_EURO);
}

/** Convierte céntimos a euros (número con precisión de céntimo). */
export function fromCents(cents) {
  return cents / CENTS_PER_EURO;
}

/** Normaliza un valor en euros tras entrada de usuario o cálculo intermedio. */
export function normalizeEuros(euros) {
  return fromCents(toCents(euros));
}

export function clampPercent(percent, min = 1, max = 100) {
  const p = Number(percent);
  if (!Number.isFinite(p)) return 50;
  return Math.min(max, Math.max(min, Math.round(p)));
}

/** Parte proporcional en céntimos (redondeo half-up al céntimo). */
export function shareCents(totalCents, percent) {
  if (totalCents <= 0) return 0;
  const pct = clampPercent(percent);
  return Math.round((totalCents * pct) / 100);
}

/**
 * Tu parte de un gasto compartido, en euros.
 * @param {number} totalEuros - Importe total del gasto
 * @param {boolean} shared - Si el gasto se reparte
 * @param {number} percent - Porcentaje que te corresponde (1–100)
 */
export function applyShareEuros(totalEuros, shared, percent) {
  const totalCents = toCents(totalEuros);
  if (!shared || totalCents <= 0) return fromCents(totalCents);
  return fromCents(shareCents(totalCents, percent));
}

/** Suma de importes en euros, resultado normalizado al céntimo. */
export function sumEuros(...amounts) {
  const totalCents = amounts.reduce((acc, e) => acc + toCents(e), 0);
  return fromCents(totalCents);
}

/** Resta en euros: minuendo − subtraendos, normalizado al céntimo. */
export function subtractEuros(minuend, ...subtrahends) {
  const resultCents =
    toCents(minuend) -
    subtrahends.reduce((acc, s) => acc + toCents(s), 0);
  return fromCents(resultCents);
}

/** Parsea texto de input monetario y devuelve euros normalizados (≥ 0). */
export function parseMoneyEuros(raw) {
  const n = parseFloat(String(raw).replace(',', '.'));
  if (!Number.isFinite(n) || n < 0) return 0;
  return normalizeEuros(n);
}

/**
 * Reparte un total en céntimos según pesos enteros (p. ej. 40, 35, 15, 10).
 * Usa el método del resto mayor para que la suma coincida exactamente con el total.
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

/** Reparte euros según pesos; devuelve array de euros normalizados. */
export function allocateEurosByWeights(totalEuros, weights) {
  return allocateCents(toCents(totalEuros), weights).map(fromCents);
}
