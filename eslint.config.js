import js from '@eslint/js';
import globals from 'globals';

export default [
    {
        // Ignore legacy files (js/script.js, js/bolt.js) - they predate the linting setup
        // and would require significant refactoring. Focus is on new modular code.
        ignores: ['assets/**', 'css/**', 'js/script.js', 'js/bolt.js'],
    },
    js.configs.recommended,
    {
        files: ['js/security-suite.js', 'js/anom-counter.js', 'js/modules/**/*.js', 'tests/**/*.js'],
        languageOptions: {
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.vitest,
            },
        },
        rules: {
            'no-console': ['error', { allow: ['info', 'warn', 'error'] }],
            'no-var': 'error',
            'prefer-const': ['error', { destructuring: 'all' }],
            'eqeqeq': ['error', 'always'],
        },
    },
];
