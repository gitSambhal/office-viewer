import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';

import { viteStaticCopy } from 'vite-plugin-static-copy';

// Read index.html content once when the plugin is initialized
const indexPath = path.join(__dirname, 'index.html');
const indexContent = fs.readFileSync(indexPath, 'utf8');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  // Create a plugin to replace environment variables in index.html
  const replaceEnvInHtml = {
    name: 'replace-env-in-html',
    transformIndexHtml(html: string) {
      return html
        .replace(/%VITE_GA4_MEASUREMENT_ID%/g, env.VITE_GA4_MEASUREMENT_ID || 'G-XXXXXXXXXX')
        .replace(/%VITE_CLARITY_PROJECT_ID%/g, env.VITE_CLARITY_PROJECT_ID || 'XXXXXXXXXX');
    }
  };
  
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: ['office.suhail.top'],
    },
    define: {
      'process.version': JSON.stringify('1.0.0'),
      'process.env': {},
      'import.meta.env.VITE_GA4_MEASUREMENT_ID': JSON.stringify(env.VITE_GA4_MEASUREMENT_ID || 'G-XXXXXXXXXX'),
      'import.meta.env.VITE_CLARITY_PROJECT_ID': JSON.stringify(env.VITE_CLARITY_PROJECT_ID || 'XXXXXXXXXX'),
    },
    plugins: [
      replaceEnvInHtml,
      tailwindcss(),
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
        modernPolyfills: true,
      }),
      viteStaticCopy({
        targets: [
          {
            src: 'node_modules/sql.js/dist/sql-wasm.wasm',
            dest: '.',
          },
        ],
      }),
      {
        name: 'handle-post-requests',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.method === 'POST' && req.url === '/') {
              console.log('[Vite] Handling POST request');
              // Allow CORS
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader(
                'Access-Control-Allow-Methods',
                'POST, GET, OPTIONS'
              );
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

              res.setHeader('Content-Type', 'text/html');
              res.statusCode = 200;

              try {
                res.end(indexContent);
              } catch (err) {
                console.error('[Vite] Error serving index.html:', err);
                res.statusCode = 500;
                res.end('Internal Server Error');
              }
            } else {
              next();
            }
          });
        },
      },
    ],
    worker: {
      format: 'es',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
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
          },
          // Ensure proper asset URL handling for PWA
          assetFileNames: (assetInfo) => {
            if (/\.svg$/.test(assetInfo.name)) {
              return 'assets/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
        },
      },
    },
  };
});
