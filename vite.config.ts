import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// GitHub Pages serves project sites at /<repo>/. GITHUB_REPOSITORY is "owner/repo" in Actions.
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'TEAL-Intelligence-';
const base = process.env.VITE_BASE ?? (process.env.NODE_ENV === 'production' ? `/${repo}/` : '/');

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          data: ['dexie', 'minisearch', 'zod'],
          charts: ['recharts'],
        },
      },
    },
  },
});
