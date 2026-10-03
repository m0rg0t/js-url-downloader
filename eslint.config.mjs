import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  { files: ['url-download.js'], languageOptions: { globals: globals.browser } },
  { files: ['tests/browser.mjs'], languageOptions: { globals: globals.browser } },
  { files: ['**/*.mjs'], languageOptions: { globals: globals.node } },
];
