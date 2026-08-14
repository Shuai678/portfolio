import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: resolve(__dirname, 'admin'),
  base: '/admin/',
  plugins: [react()],
  server: {
    fs: {
      allow: [__dirname],
    },
  },
  build: {
    outDir: resolve(__dirname, 'analytics/public/admin'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'admin/index.html'),
    },
  },
});
