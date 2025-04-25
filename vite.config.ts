import * as path from 'node:path';
import { createRequire } from 'node:module';
import { defineConfig, normalizePath } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

function resolveNodeModulePath(moduleName: string) {
  const require = createRequire(import.meta.url);
  let modulePath = normalizePath(require.resolve(moduleName));
  while (!modulePath.endsWith(moduleName)) {
    const newPath = path.posix.dirname(modulePath);
    if (newPath === modulePath)
      throw new Error(`Could not resolve ${moduleName}`);
    modulePath = newPath;
  }
  return modulePath;
}

function resolvePath(...args: string[]) {
  return normalizePath(path.resolve(...args));
}

const rootDir = resolvePath(__dirname);
const distDir = resolvePath(rootDir, 'dist');

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        {
          src: resolvePath(
            resolveNodeModulePath('itk-wasm'),
            'dist/pipeline/web-workers/bundles/itk-wasm-pipeline.min.worker.js',
          ),
          dest: 'itk',
        },
        {
          src: resolvePath(
            resolveNodeModulePath('@itk-wasm/image-io'),
            'dist/pipelines/*{.wasm,.js,.zst}',
          ),
          dest: 'itk/image-io',
        },
        {
          src: resolvePath(
            resolveNodeModulePath('@itk-wasm/dicom'),
            'dist/pipelines/*{.wasm,.js,.zst}',
          ),
          dest: 'itk/pipelines',
        },
        {
          src: resolvePath(
            rootDir,
            'src/io/itk-dicom/emscripten-build/**/dicom*',
          ),
          dest: 'itk/pipelines',
        },
        {
          src: resolvePath(
            rootDir,
            'src/io/resample/emscripten-build/**/resample*',
          ),
          dest: 'itk/pipelines',
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: distDir,
  },
  optimizeDeps: {
    exclude: ['itk-wasm', '@itk-wasm/image-io', '@itk-wasm/dicom'],
  },
});
