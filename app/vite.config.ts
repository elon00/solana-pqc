import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: process.env.NETLIFY ? '/' : (process.env.VITE_BASE || '/scstobcminority-ai/'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': {},
  },
  optimizeDeps: {
    include: ['@solana/web3.js', '@solana/wallet-adapter-react'],
  },
});
