/** Merge finance lists by id; the second list wins field conflicts. */
export function mergeFinanceLists(base = [], incoming = []) {
  const fromBase = Array.isArray(base) ? base : [];
  const fromIncoming = Array.isArray(incoming) ? incoming : [];

  if (!fromBase.length) return fromIncoming;
  if (!fromIncoming.length) return fromBase;

  const byId = new Map();
  for (const item of fromBase) {
    if (item?.id) byId.set(item.id, item);
  }
  for (const item of fromIncoming) {
    if (!item?.id) continue;
    const prev = byId.get(item.id);
    byId.set(item.id, prev ? { ...prev, ...item } : item);
  }
  return [...byId.values()];
}

export function dedupeFinanceList(items = []) {
  const byId = new Map();
  for (const item of items) {
    if (!item?.id) continue;
    const prev = byId.get(item.id);
    byId.set(item.id, prev ? { ...prev, ...item } : item);
  }
  return [...byId.values()];
}
