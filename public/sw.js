const CACHE_NAME = 'suhail-viewer-v7';

// Core assets to cache
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// CDN resources to cache for offline use - must be cacheable (CORS enabled)
const CDN_RESOURCES = [
  'https://cdn.tailwindcss.com?plugins=typography',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js',
  'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js',
  'https://cdn.jsdelivr.net/npm/docx-preview@0.1.15/dist/docx-preview.js',
  'https://unpkg.com/rtf.js/dist/RTFJS.bundle.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf_viewer.min.css',
  'https://esm.sh/react@19.0.0',
  'https://esm.sh/react-dom@19.0.0/client',
  'https://esm.sh/react-dom@^19.2.4/',
  'https://esm.sh/react@^19.2.4/',
];

// Install event - cache core assets and CDN resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      // Cache core assets
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(CORE_ASSETS).catch((err) => {
          console.warn('Failed to cache core assets:', err);
        });
      }),
      // Cache CDN resources with CORS mode
      caches.open(CACHE_NAME).then((cache) => {
        return Promise.all(
          CDN_RESOURCES.map((url) => {
            return fetch(url, { mode: 'cors' })
              .then((response) => {
                if (response && response.status === 200) {
                  return cache.put(url, response);
                }
              })
              .catch((err) => {
                console.warn('Failed to cache CDN resource:', url, err);
              });
          })
        );
      }),
    ]).then(() => {
      self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Handle navigation requests (SPA routing)
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/').then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        }).catch(() => {
          // Fallback to index.html if network fails
          return caches.match('/');
        });
      })
    );
    return;
  }

  // Handle same-origin static assets (JS, CSS, images, WASM, etc.)
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        }).catch(() => {
          // Return a basic error response for failed asset loads
          return new Response('Asset not available offline', { status: 503 });
        });
      })
    );
    return;
  }

  // Handle cross-origin requests (CDN resources) - cache first, then network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((response) => {
        // Cache successful responses (allow both 'basic' and 'cors' types)
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // For offline CDN resources, return an empty response that won't break the page
        // This allows the page to load even if some CDNs are unavailable
        return new Response('', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      });
    })
  );
});
