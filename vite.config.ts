import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  // 🔒 SECURITY: DO NOT use `define` to inject server-side API keys into the client bundle.
  // All AI calls should go through /api/ai/generate endpoint in server.ts
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
      allowedHosts: true, // 🔓 Allow tunnels like localtunnel
    },
  };
});
