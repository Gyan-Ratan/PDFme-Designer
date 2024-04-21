import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  build: { target: 'esnext' },
  plugins: [react()],
  server: {
    port: 3000 // Change this to the desired port number
  }
});
