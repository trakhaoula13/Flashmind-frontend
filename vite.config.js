import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En développement, /api est redirigé vers le backend Express (port 5000)
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': { target: 'https://flashmind-backend-os7m.onrender.com', changeOrigin: true },
        },
    },
});