import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { transform } from 'esbuild';

// Vite keeps whitespace in ES library builds (for downstream bundlers). This
// bundle goes straight to the browser, so minify it fully.
function minifyEsLib(): Plugin {
  return {
    name: 'minify-es-lib',
    apply: 'build',
    async generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue;
        const result = await transform(chunk.code, { minify: true, format: 'esm', target: 'es2020' });
        chunk.code = result.code;
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), minifyEsLib()],
  // Library mode does not replace process.env.NODE_ENV by itself; React needs it
  // to pick its production build.
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
  },
  server: {
    port: 5173,
  },
  build: {
    target: 'es2020',
    // Only the custom element entry is built. src/dev/* (token + websocket)
    // is reachable from index.html only, so it never lands in the bundle.
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
      fileName: () => 'ha-dashboard.js',
    },
    rollupOptions: {
      // Bundle everything (React included): HA loads one self-contained file.
      external: [],
    },
    sourcemap: false,
  },
}));
