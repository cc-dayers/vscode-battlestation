import eslint from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";
import litPlugin from "eslint-plugin-lit";

export default [
    {
        files: ["src/**/*.ts"],
        languageOptions: {
            parser,
            parserOptions: {
                ecmaVersion: 2021,
                sourceType: "module",
            },
        },
        plugins: {
            "@typescript-eslint": eslint,
            lit: litPlugin,
        },
        rules: {
            // TypeScript recommended rules (subset)
            "@typescript-eslint/no-unused-vars": [
                "warn",
                { argsIgnorePattern: "^_" },
            ],
            "@typescript-eslint/no-explicit-any": "warn",

            // Lit-specific rules
            ...litPlugin.configs.recommended.rules,
        },
    },
    {
        ignores: ["dist/**", "out/**", "media/**", "node_modules/**", "*.js"],
    },
];
