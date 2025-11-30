import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
    'window.__REACT_QUERY_DEVTOOLS__': 'false',
  },
  base: './',
  build: {
    outDir: 'dist-react',
    sourcemap: true,
  },
  server: {
    port: 5123,
    strictPort: true,
  },
});
