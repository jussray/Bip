// eslint.config.js
// Se'kret Bip — ESLint v9 flat config with TypeScript support.
//
// Uses the official `typescript-eslint` umbrella so parsing works for .ts /
// .tsx files. Rules are intentionally permissive: we keep parser-level
// hazards (no-debugger, no-dupe-keys, no-unreachable) and let `npm run
// type-check` (`tsc --noEmit`) own the deep type analysis.

const tseslint = require('typescript-eslint');

const runtimeGlobals = {
  console:       'readonly',
  process:       'readonly',
  fetch:         'readonly',
  setTimeout:    'readonly',
  clearTimeout:  'readonly',
  setInterval:   'readonly',
  clearInterval: 'readonly',
  global:        'readonly',
  __DEV__:       'readonly',
  require:       'readonly',
  module:        'readonly',
  exports:       'readonly',
};

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'web-build/**',
      'android/**',
      'ios/**',
      'package.master.json',
      '**/*.jsonc',
      'eslint.config.js',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,jsx,mjs,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: runtimeGlobals,
    },
    rules: {
      // Keep practical hazards on
      'no-debugger':           'error',
      'no-dupe-keys':          'error',
      'no-unreachable':        'warn',
      'no-constant-condition': ['warn', { checkLoops: false }],

      // The TS-aware versions of these rules are noisy on this codebase
      // (lots of intentionally-unused screen props). Re-enable selectively
      // later if desired.
      'no-unused-vars':                       'off',
      '@typescript-eslint/no-unused-vars':    'off',
      '@typescript-eslint/no-explicit-any':   'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/ban-ts-comment':    'off',
      // React Native requires `require()` for static image assets.
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
