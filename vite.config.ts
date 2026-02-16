import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Fix TS error: "Property 'cwd' does not exist on type 'Process'" by casting to any
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Guidelines: The API key must be obtained exclusively from the environment variable process.env.API_KEY
  const finalApiKey = env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // O JSON.stringify é crucial para que o Vite substitua corretamente no bundle final
      'process.env.API_KEY': JSON.stringify(finalApiKey),
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