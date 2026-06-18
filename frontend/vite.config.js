import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { version } = require('./package.json');

// Change this to '/' for root deployments, or '/your/subpath/' for subdirectories.
const APP_BASE = '/applications/financapp/';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'favicon.svg'],
      manifest: {
        name: 'Financapp',
        short_name: 'Financapp',
        description: 'Gestión de tus finanzas personales',
        theme_color: '#1A3A5C',
        background_color: '#0f1117',
        display: 'standalone',
        orientation: 'portrait',
        start_url: APP_BASE,
        scope: APP_BASE,
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  base: APP_BASE,
  build: {
    outDir: 'dist',
  },
  optimizeDeps: {
    include: ['@supabase/supabase-js'],
  },
  test: {
    environment: 'node',
    include: ['src/**/*.spec.js', 'src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/utils/**'],
      exclude: ['src/lib/**/*.test.js', 'src/lib/**/*.vitest.js'],
      thresholds: { lines: 80, functions: 80 },
    },
  },
});
