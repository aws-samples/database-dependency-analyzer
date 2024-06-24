// @ts-check

import eslint from "@eslint/js";
import security from "eslint-plugin-security";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["node_modules/**"],
  },
  eslint.configs.recommended,
  eslint.configs.recommended,
  {
    ...security.configs.recommended,
    rules: {
      ...security.configs.recommended.rules,
      "security/detect-object-injection": "off", // too many false positives
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  ...tseslint.configs.recommended,
);
