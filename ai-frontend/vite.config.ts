import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __BUNDLED_DEV__: false,
  },
  server: {
    port: 5175,
    host: true,
    proxy: {
      '/api/ai-data': {
        target: 'http://localhost:5007',
        changeOrigin: true,
        secure: false,
      },
      '/api/ai': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        headers: {
          'X-API-Key': 'change-me'
        },
      }
    }
  }
});

