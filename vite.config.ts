import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite'


export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
 

    plugins: [
      tailwindcss(),
    ],

   
  };
});
