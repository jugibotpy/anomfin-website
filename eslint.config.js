// AnomFIN — the neural network of innovation.
import js from '@eslint/js';

export default [
  {
    ignores: [
      'assets/**',
      'data/**',
      'latest.zip',
      'node_modules/**',
    ],
  },
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        performance: 'readonly',
        matchMedia: 'readonly',
        localStorage: 'readonly',
        AbortController: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-console': ['warn', { allow: ['error', 'warn', 'info', 'debug'] }],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
];
