import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'node-fetch': path.resolve(__dirname, 'src/empty.ts'),
        'formdata-polyfill': path.resolve(__dirname, 'src/empty.ts'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      allowedHosts: true as true, // Allow tunnels like localtunnel
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-motion': ['framer-motion'],
            'vendor-icons': ['lucide-react'],
            'vendor-i18n': ['i18next', 'react-i18next', 'zustand'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-3d': ['three', '@google/model-viewer']
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  };
});
