import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  root: resolve(__dirname, '../../src'),
  publicDir: resolve(__dirname, '../../public'),
  mode: process.env.NODE_ENV,
  plugins: [react()],
  build: {
    emptyOutDir: true,
    outDir: '../../build',
    rollupOptions: {
      output: {
        format: 'cjs',
      },
    },
  },
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      path: 'path-browserify',
      stream: 'stream-browserify',
      http: 'stream-http',
      https: 'https-browserify',
      // 'react/jsx-runtime': 'react/jsx-runtime.js',
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        modifyVars: {
          hack: `true; @import (reference) "${resolve(__dirname, '../../src/variables.less')}";`,
        },
        javascriptEnabled: true,
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: false,
        }),
      ],
    },
  },
});
