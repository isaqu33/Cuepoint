/** ESLint do Cuepoint: TypeScript + Svelte + Prettier. Erros = bugs prováveis; o resto é aviso. */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', extraFileExtensions: ['.svelte'] },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:svelte/recommended', 'prettier'],
  env: { browser: true, es2022: true, node: true },
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/no-empty-function': 'off',
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-undef': 'off', // o TypeScript já checa
    'svelte/no-at-html-tags': 'warn',
    'svelte/valid-compile': 'warn',
  },
  overrides: [
    { files: ['*.svelte'], parser: 'svelte-eslint-parser', parserOptions: { parser: '@typescript-eslint/parser' } },
    { files: ['tests/**/*.ts', '**/*.test.ts'], rules: { '@typescript-eslint/no-explicit-any': 'off', '@typescript-eslint/ban-ts-comment': 'off' } },
  ],
  ignorePatterns: ['*.cjs', 'static/*.js', 'svelte.config.js', 'node_modules', 'dist', 'dist-worker', 'build', '.svelte-kit', 'realtime/**'],
};
