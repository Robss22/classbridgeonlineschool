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
      "coverage/**/*",
      "*.min.js",
      "*.bundle.js",
      "tailwind.config.js"
    ]
  },
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        global: "readonly",
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        alert: "readonly",
        confirm: "readonly",
        prompt: "readonly",
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly"
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      "no-console": "off", // Allow console statements
      "no-undef": "off", // Turned off since we're defining globals
      "no-empty": "warn",
      "no-case-declarations": "warn",
      "no-redeclare": "warn"
    }
  },
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "react-hooks/exhaustive-deps": "off", // Disable React hooks exhaustive deps warning
      "no-console": "off" // Allow console statements in TypeScript files too
    }
  },
  {
    files: [
      "**/test*.js",
      "**/diagnose*.js", 
      "**/quick*.js",
      "**/build-optimization.js",
      "**/next.config*.js"
    ],
    rules: {
      "no-console": "off" // Allow console statements in test and config files
    }
  }
];

export default config;
