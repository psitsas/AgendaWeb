import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/',

  server: {
    port: 5173,
    proxy: {
      // En desarrollo: redirige /api → API local en :5062
      '/api': {
        target: 'http://localhost:5062',
        changeOrigin: true,
      },
      // WebSocket para SignalR
      '/hubs': {
        target: 'http://localhost:5062',
        changeOrigin: true,
        ws: true,
      },
    },
  },

  build: {
    outDir:      'dist',
    emptyOutDir: true,
    sourcemap:   false,
  },
});
