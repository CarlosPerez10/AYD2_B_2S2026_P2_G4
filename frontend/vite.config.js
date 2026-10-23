import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En desarrollo, Vite reenvía /api al gateway igual que Nginx en producción,
// así el código siempre usa rutas relativas.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': process.env.VITE_GATEWAY_URL || 'http://localhost:8080',
    },
  },
});
