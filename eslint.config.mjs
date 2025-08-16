import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const config = [
  {
    ignores: [
      ".next/**/*",
      "node_modules/**/*",
      "database.types.ts",
      "lib/supabase.types.ts",
      "dist/**/*",
      "build/**/*",
      "*.min.js",
      "*.bundle.js",
      "tailwind.config.js"
    ]
  },
  ...compat.extends("next/core-web-vitals"),
];

export default config;
