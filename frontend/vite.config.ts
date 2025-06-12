import { defineConfig } from 'vite'
// Vitest typing; only for TS, stripped out in emit
// eslint-disable-next-line import/no-extraneous-dependencies
import type { UserConfig as VitestUserConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html'],
    },
  } as VitestUserConfig['test'],
  server: {
    host: true,
    port: 3000,
    watch: {
      usePolling: true
    }
  }
}) 