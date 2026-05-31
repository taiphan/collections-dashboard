import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: { reporter: ['text', 'lcov'], include: ['src/**'] },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
