import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development, Vite (port 5173) forwards /api calls to the Express server (port 5000),
// so the browser sees a single origin and the httpOnly auth cookie just works.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5001', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
