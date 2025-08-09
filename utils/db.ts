export function normalizeForInsert(obj: Record<string, any>) {
  // Convert undefined to null for DB inserts/updates to satisfy strict optional types.
  if (!obj || typeof obj !== 'object') return obj;
  const out: Record<string, any> = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    out[k] = v === undefined ? null : v;
  }
  return out;
}
export function normalizeArrayForInsert(arr: any[]) {
  return arr.map(a => normalizeForInsert(a));
}
