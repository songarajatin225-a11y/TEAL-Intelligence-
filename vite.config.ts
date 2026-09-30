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
  // the 3D stack loads only with the 3D machine view; glTF exporters stay separate (on demand)
  [/node_modules\/(three(?!\/examples\/jsm\/exporters)|@react-three|three-stdlib|three-mesh-bvh|troika-[^/]+|camera-controls|maath|meshline|@monogrid|stats-gl|stats\.js|detect-gpu|hls\.js|zustand|its-fine|suspend-react|react-reconciler|react-use-measure|tunnel-rat|@use-gesture)\//, 'three'],
];

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // the 3D vendor chunk (three + react-three) is ~1 MB and loads only with the 3D machine view
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => VENDOR.find(([re]) => re.test(id))?.[1],
      },
    },
  },
});
