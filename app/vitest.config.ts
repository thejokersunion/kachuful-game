import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.expo', 'android', 'ios'],
  },
  resolve: {
    alias: {
      components: path.resolve(__dirname, './components'),
      app: path.resolve(__dirname, './app'),
      '@partykit': path.resolve(__dirname, '../partykit'),
    },
  },
})
