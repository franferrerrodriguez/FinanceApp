/** "A, B y C" (es) or "A, B and C" (en). */
export function formatConjunctionList(items, locale = 'es') {
  const names = (items ?? []).filter(Boolean);
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  const conj = String(locale).startsWith('es') ? ' y ' : ' and ';
  if (names.length === 2) return `${names[0]}${conj}${names[1]}`;
  return `${names.slice(0, -1).join(', ')}${conj}${names.at(-1)}`;
}
