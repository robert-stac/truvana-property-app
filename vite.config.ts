import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // This tells Vite: "All my files are inside the /property-app-updates/ folder"
  base: '/', 
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Truvana Holdings Property Management',
        short_name: 'Truvana HoldingsMgmt',
        description: 'Property Management System for Truvana Holdings.',
        theme_color: '#1d4ed8',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    // Ensure assets are placed correctly
    outDir: 'dist',
    assetsDir: 'assets',
  }
});