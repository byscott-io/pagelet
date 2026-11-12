import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Node by default, so the renderer is proven to work with no DOM at all.
    // Tests that need a browser opt in with `// @vitest-environment jsdom`.
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
    setupFiles: ['test/setup-dom.js'],
  },
});
