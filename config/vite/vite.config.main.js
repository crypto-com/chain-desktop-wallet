import {resolve} from 'path';
import { builtinModules } from 'module';
import { defineConfig } from 'vite';
import pkg from '../../package.json';

export default defineConfig({
  root: '../../electron',
  build: {
    outDir: resolve(__dirname, '../../build/electron'),
    lib: {
      entry: resolve(__dirname, '../../electron/main.ts'),
      formats: ['cjs'],
      fileName: () => '[name].js',
    },
    minify: process.env./* from mode option */ NODE_ENV === 'production',
    emptyOutDir: true,
    rollupOptions: {
      external: ['electron', ...builtinModules, ...Object.keys(pkg.dependencies || {})],
    },
  },
});
