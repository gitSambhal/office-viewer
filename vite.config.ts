import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        nodePolyfills({
          exclude: [],
          globals: {
            global: true,
            process: true,
          },
        }),
        legacy({
          targets: ['defaults', 'IE 11'],
          additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
          modernPolyfills: true
        }),
        viteStaticCopy({
          targets: [
            {
              src: 'node_modules/sql.js/dist/sql-wasm.wasm',
              dest: '.'
            }
          ]
        })
      ],
      worker: {
        format: 'es'
      },
      define: {
        'process.version': JSON.stringify('1.0.0'),
        'process.env': {},
        // 'global': 'window',
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        sourcemap: false,
        rollupOptions: {
          output: {
            manualChunks: (id) => {
              if (id.includes('node_modules')) {
                return 'vendor';
              }
            }
          }
        }
      }
    };
});
