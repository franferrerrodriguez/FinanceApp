/** Merge cloud + local finance lists by id (local wins field conflicts). */

export function mergeFinanceLists(cloud = [], local = []) {
  const fromCloud = Array.isArray(cloud) ? cloud : [];
  const fromLocal = Array.isArray(local) ? local : [];

  if (!fromCloud.length) return fromLocal;
  if (!fromLocal.length) return fromCloud;

  const byId = new Map();
  for (const item of fromCloud) {
    if (item?.id) byId.set(item.id, item);
  }
  for (const item of fromLocal) {
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
