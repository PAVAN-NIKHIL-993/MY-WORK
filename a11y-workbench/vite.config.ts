import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

/**
 * Vite configuration for a11y-workbench.
 *
 * The app is a static, client-side SPA. `base` is configurable so the same
 * build can be hosted at a domain root ("/") or on a sub-path (GitHub Pages).
 */
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // The preview proxy serves the app from a generated *.e2b.app host, so the
    // dev server must not restrict by host or origin allow-lists.
    allowedHosts: true,
    cors: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    allowedHosts: true,
    cors: true,
  },
  build: {
    target: 'es2022',
    // Source maps aid debugging a deployed build, but they ship the full source
    // to every visitor. Disable with VITE_SOURCEMAP=false for a release where
    // that trade-off is not wanted.
    sourcemap: process.env.VITE_SOURCEMAP !== 'false',
    outDir: 'dist',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/main.tsx', 'src/**/*.d.ts'],
    },
  },
});
