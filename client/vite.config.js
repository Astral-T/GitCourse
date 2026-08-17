import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ command }) => ({
  base: '/',
  // basicSsl solo en desarrollo local (no aplica en build de producción)
  plugins: command === 'serve' ? [basicSsl()] : [],

  server: {
    host: true,
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },

  build: {
    outDir: 'dist',
    // Generar sourcemaps solo en desarrollo para no exponer código fuente en prod
    sourcemap: false,
    rollupOptions: {
      output: {
        // Separar vendor chunks para mejor caché en el browser
        manualChunks: {
          apexcharts: ['apexcharts'],
          three: ['three']
        }
      }
    }
  }
}));
