import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['.e2b.app'],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          minSize: 20000,
          groups: [
            { name: 'firebase', test: /node_modules\/@firebase\// },
            {
              name: 'react-vendor',
              test: /node_modules\/(react|react-dom|react-redux|react-router|react-router-dom|@reduxjs\/toolkit)\//,
            },
            { name: 'animation-vendor', test: /node_modules\/framer-motion\// },
          ],
        },
      },
    },
  },
});
