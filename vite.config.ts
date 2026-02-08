import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'models-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
        ],
      },
      manifest: {
        name: 'GoAI Editor',
        short_name: 'GoAI',
        description: 'Interactive Go game editor with AI analysis and OCR',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        screenshots: [
          {
            src: '/screenshots/desktop.png',
            sizes: '1280x720',
            form_factor: 'wide',
          },
          {
            src: '/screenshots/mobile.png',
            sizes: '540x720',
            form_factor: 'narrow',
          },
        ],
        shortcuts: [
          {
            name: 'Créer une partie',
            short_name: 'Nouvelle',
            description: 'Créer une nouvelle partie de Go',
            url: '/?action=new',
            icons: [
              {
                src: '/icons/new-game.png',
                sizes: '192x192',
              },
            ],
          },
          {
            name: 'Importer SGF',
            short_name: 'Importer',
            description: 'Importer un fichier SGF',
            url: '/?action=import',
            icons: [
              {
                src: '/icons/import.png',
                sizes: '192x192',
              },
            ],
          },
        ],
        categories: ['games', 'education'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@store': path.resolve(__dirname, './src/store'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'tests/e2e/**',
    ],
    environment: 'node',
  },
  build: {
    target: 'ES2020',
    minify: 'terser',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-redux'],
          redux: ['@reduxjs/toolkit'],
          i18n: ['i18next', 'react-i18next'],
          tf: ['@tensorflow/tfjs'],
        },
      },
    },
  },
});
