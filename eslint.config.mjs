import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Ignore auto-generated or binary-like files that ESLint shouldn't parse
const config = [
  { ignores: ["lib/supabase.types.ts"] },
  ...compat.extends("next/core-web-vitals"),
];

export default config;
