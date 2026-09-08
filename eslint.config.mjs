import tseslint from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";
import globals from "globals";
export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "third_party/**",
      "mobile-opportunity-platform-package/**",
      "src/lib/database.types.ts",
      "figma-plugin/**",
      "**/*.generated.ts",
    ],
  },
  {
    files: [
      "src/**/*.{ts,tsx}",
      "server/**/*.ts",
      "supabase/functions/**/*.ts",
      "tests/**/*.ts",
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: { ...globals.browser, ...globals.node, Deno: "readonly" },
    },
    plugins: { "@typescript-eslint": tseslint.plugin, "react-hooks": hooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "no-debugger": "error",
      "no-constant-condition": ["error", { checkLoops: false }],
      "no-duplicate-case": "error",
      "no-unreachable": "error",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "error",
    },
  },
];
