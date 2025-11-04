// AnomFIN — the neural network of innovation.
import js from '@eslint/js';

export default [
  {
    ignores: [
      'assets/**',
      'css/**',
      'data/**',
      'latest.zip',
      'node_modules/**',
    ],
  },
  {
    files: ['js/**/*.js', 'tests/**/*.js'],
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
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        console: 'readonly',
        getComputedStyle: 'readonly',
        IntersectionObserver: 'readonly',
        FormData: 'readonly',
        DOMParser: 'readonly',
        Node: 'readonly',
        CustomEvent: 'readonly',
        Notification: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        L: 'readonly',
        Chart: 'readonly',
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
