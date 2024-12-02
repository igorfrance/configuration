import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        ignores: ["dist"]
    },
    {
        files: ["**/*.{js,mjs,cjs,ts}"]
    },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            semi: ["error", "always"],
            quotes: ["error", "double"],
        }
    }
]; 
