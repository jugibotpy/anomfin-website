// Vitest configuration for AnomFIN tests
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.test.js'],
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
});
