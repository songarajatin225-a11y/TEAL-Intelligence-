import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// GitHub Pages serves project sites at /<repo>/. GITHUB_REPOSITORY is "owner/repo" in Actions.
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'TEAL-Intelligence-';
const base = process.env.VITE_BASE ?? (process.env.NODE_ENV === 'production' ? `/${repo}/` : '/');

/** Vendor libraries in their own long-cached chunks: an app deploy does not re-download them. */
const VENDOR: [RegExp, string][] = [
  [/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom|clsx)\//, 'react'],
  [/node_modules\/(dexie|minisearch|zod)\//, 'data'],
  [/node_modules\/(recharts|d3-[^/]+|victory-vendor)\//, 'charts'],
  [/node_modules\/@tanstack\//, 'table'],
  [/node_modules\/react-hook-form\//, 'forms'],
  [/node_modules\/lucide-react\//, 'icons'],
];

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: (id) => VENDOR.find(([re]) => re.test(id))?.[1],
      },
    },
  },
});
