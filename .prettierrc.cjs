module.exports = {
  singleQuote: true,
  printWidth: 100,
  useTabs: false,
  tabWidth: 2,
  bracketSpacing: true,
  svelteSortOrder: 'scripts-styles-markup-options',
  svelteStrictMode: false,
  svelteAllowShorthand: true,
  plugins: ['prettier-plugin-svelte', 'prettier-plugin-tailwindcss'],
  overrides: [
    {
      files: '*.svelte',
      options: {
        parser: 'svelte',
      },
    },
    {
      files: '*.ts',
      options: {
        parser: 'typescript',
      },
    },
  ],
};
