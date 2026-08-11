
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  
  envDir: './env',

  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },

  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.js'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**']
  }
});