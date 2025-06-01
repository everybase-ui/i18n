import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Configure Vitest (https://vitest.dev/config/)
  test: {
    environment: 'happy-dom',
    setupFiles: './vitest.setup.ts',
    globals: true,
    alias: {
      '@': '/src',
    },
    coverage: {
      include: ['src'],
    },
  },
});
