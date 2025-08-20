export function normalizeForInsert(obj: Record<string, unknown>) {
  // Convert undefined to null for DB inserts/updates to satisfy strict optional types.
  if (!obj || typeof obj !== 'object') return obj;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    out[k] = v === undefined ? null : v;
  }
  return out;
}
export function normalizeArrayForInsert(arr: Array<Record<string, unknown>>) {
  return arr.map(a => normalizeForInsert(a));
}
