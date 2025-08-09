// Utility to ensure only valid fields for DB insert/update are sent
// Usage: normalizeForInsert<T>(data: any, allowedFields: (keyof T)[]): T
export function normalizeForInsert<T extends object>(data: any, allowedFields: (keyof T)[]): T {
  const result: Partial<T> = {};
  for (const key of allowedFields) {
    if (key in data) {
      (result as any)[key] = data[key];
    }
  }
  return result as T;
}
