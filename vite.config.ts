import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Injeta a variável de ambiente API_KEY configurada na Vercel
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
});