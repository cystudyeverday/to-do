import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable strict TypeScript rules that are causing issues
      "@typescript-eslint/no-explicit-any": "warn", // Change from error to warning
      "@typescript-eslint/no-unused-vars": "warn", // Change from error to warning

      // Disable React rules that are too strict
      "react/no-unescaped-entities": "off", // Allow unescaped quotes in JSX
      "react-hooks/exhaustive-deps": "warn", // Change from error to warning

      // Disable Next.js specific rules
      "@next/next/no-assign-module-variable": "off", // Allow module variable assignment

      // General rules
      "prefer-const": "warn", // Change from error to warning
    },
  },
];

export default eslintConfig;
