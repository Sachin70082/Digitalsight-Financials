import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],

    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    server: {
      host: 'localhost',
      port: 5173,
      strictPort: true,

      hmr: process.env.DISABLE_HMR !== 'true',

      // 🔥 IMPORTANT: Proxy API calls to Wrangler dev (Worker)
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8787', // must match wrangler dev
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
