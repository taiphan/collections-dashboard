import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    globals: false,
    /**
     * Testcontainers + migrations + DB I/O takes longer than a unit test.
     * 120 s per test is generous; individual tests aim for < 5 s.
     */
    testTimeout: 120_000,
    hookTimeout: 120_000,
    /**
     * Run integration tests serially. Each test pulls a fresh schema; running
     * in parallel is supported but the seeded data fixtures assume one tenant
     * id per test file.
     */
    fileParallelism: false,
  },
});
