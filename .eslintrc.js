module.exports = {
    env: {
        es2021: true,
        node: true,
        commonjs: true,
    },
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2021,
        project: "./tsconfig.json",
    },
    plugins: ["@typescript-eslint"],
    ignorePatterns: ["dist", "node_modules"],
    rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-empty-function": "off",
    }
};
