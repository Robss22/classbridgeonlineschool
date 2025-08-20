// Utility to ensure only valid fields for DB insert/update are sent
// Usage: normalizeForInsert<T>(data: Record<string, unknown>, allowedFields: (keyof T)[]): T
export function normalizeForInsert<T extends Record<string, unknown>>(
  data: Record<string, unknown>,
  allowedFields: Array<keyof T>
): T {
  return allowedFields.reduce((result, key) => {
    if (key in data) {
      // Safe assertion since we checked 'key in data'
      result[key as keyof T] = data[key as string] as T[keyof T];
    }
    return result;
  }, {} as T);
}
