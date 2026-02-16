import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente baseadas no modo atual (development/production)
  // O terceiro argumento '' permite carregar variáveis sem o prefixo VITE_ (como API_KEY)
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Injeta a variável de ambiente de forma robusta
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || 'AIzaSyB7pgsekcpDJOOUU3kUG1fCh1lmm061iHU'),
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: './index.html',
        },
      },
    },
  };
});