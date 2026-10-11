import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En développement, /api est redirigé vers le backend Express (port 5000)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
});
