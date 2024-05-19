import globals from 'globals';
import pluginJs from '@eslint/js';
import stylisticJs from '@stylistic/eslint-plugin-js';

export default [
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  {
    plugins: {
      '@stylistic/js': stylisticJs,
    },
    rules: {
      'no-underscore-dangle': 0,
      '@stylistic/js/quotes': ['error', 'single'],
      '@stylistic/js/max-len': ['error', { 'code': 100 }]
    },
  },
];
