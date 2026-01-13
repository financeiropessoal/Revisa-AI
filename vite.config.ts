import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Permite que o código acesse a chave como process.env.API_KEY
    // A variável deve ser criada na Vercel apenas como API_KEY
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env': '({})',
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