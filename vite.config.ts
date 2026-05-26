import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg', 'icons/*.ico'],
      manifest: {
        id: '/',
        name: 'AIWMR Training Academy',
        short_name: 'AIWMR',
        description: 'ISO-certified online certification courses in Environment, Waste Management & Sustainability from Ashrita Institute, Hyderabad.',
        theme_color: '#1a3a2a',
        background_color: '#f7f3ec',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'en',
        dir: 'ltr',
        categories: ['education', 'productivity', 'business'],
        icons: [
          {
            src: '/icons/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: 'index.html',
        // Don't intercept /privacy.html or future static legal pages
        navigateFallbackDenylist: [/^\/privacy/, /^\/terms/, /^\/\.well-known/],
      },
    }),
  ],
  server: { port: 3000, open: true },
})
