// Your attack surface, explained.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.test.js', 'tests/**/*.test.js'],
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
});
