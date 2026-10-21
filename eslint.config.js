const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = [
  ...expoConfig,
  // Edge Function entry points run on Deno (npm: imports, the Deno global); their logic
  // lives beside them in plain modules that are linted and tested like the app.
  { ignores: ['dist/*', 'android/*', 'ios/*', '.expo/*', 'supabase/functions/**/index.ts'] },
  {
    languageOptions: { globals: { ...globals.jest } },
    rules: {
      quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      'jsx-quotes': ['error', 'prefer-single'],
      // Apostrophes in JSX text are fine; escaping them only hurts readability.
      'react/no-unescaped-entities': 'off',
      // One import line per module, so the list at the top of a file stays as short as it can.
      'import/no-duplicates': 'error',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
