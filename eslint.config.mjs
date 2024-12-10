import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import * as fs from "fs";

const eslint = JSON.parse(fs.readFileSync("./src/eslint/rules.json", "utf-8"));

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
    eslint,
    {
        rules: {
            "max-len": ["warn", { "code": 120 }],
            "implicit-arrow-linebreak": "off"
        }
    }
];
