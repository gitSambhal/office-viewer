const CACHE_NAME = 'suhail-viewer-v10';

// IndexedDB name for storing shared files
const DB_NAME = 'suhail-viewer-shared-files';
const DB_VERSION = 1;
const STORE_NAME = 'files';

// Core assets to cache
const CORE_ASSETS = ['/', '/index.html', '/manifest.json'];

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

// Open IndexedDB and return a promise
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

// Store file data in IndexedDB
async function storeFileData(fileData) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(fileData);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

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

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_SHARED_FILES') {
    // Client is asking for shared files
    event.ports[0].postMessage({ type: 'SHARED_FILES' });
  }
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle share_target POST requests (file sharing to PWA)
  if (request.method === 'POST' && url.pathname === '/') {
    console.log('[SW] Handling share_target POST request');
    event.respondWith(
      (async () => {
        // Always return index.html first (so the app loads)
        let indexResponse;
        try {
          // Try to get cached version first
          const cachedResponse = await caches.match('/');
          if (cachedResponse) {
            console.log('[SW] Returning cached index.html');
            indexResponse = cachedResponse;
          } else {
            // If no cache, fetch index.html from network
            const response = await fetch('/');
            // Cache it for future use
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put('/', response.clone()));
            console.log('[SW] Fetched and cached new index.html');
            indexResponse = response;
          }
        } catch (err) {
          console.error('[SW] Error getting index.html:', err);
          return new Response('Offline - App not available', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          });
        }

        // Process the POST request to extract file data (asynchronously so we don't block the response)
        processShareTargetRequest(request).catch((err) => {
          console.error('[SW] Error processing share_target request:', err);
        });

        return indexResponse;
      })()
    );
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Handle navigation requests (SPA routing) - network first for fresh content
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put('/', responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cached version if network fails
          return caches.match('/');
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
        return fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
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
      return fetch(request)
        .then((response) => {
          // Cache successful responses (allow both 'basic' and 'cors' types)
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
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

// Process share_target POST request and store file data
async function processShareTargetRequest(request) {
  try {
    console.log('[SW] Processing share target request');

    // Clone request before reading body
    const clonedRequest = request.clone();

    // Try to read form data
    try {
      const formData = await clonedRequest.formData();
      const files = formData.getAll('files');

      console.log('[SW] Share target request received, files:', files.length);

      if (files.length > 0) {
        // Generate a unique ID for this share session
        const shareId =
          Date.now().toString(36) + Math.random().toString(36).substr(2);

        // Convert File objects to serializable data (since Blob might not serialize directly)
        const fileData = {
          id: shareId,
          files: [],
          timestamp: Date.now(),
        };

        // Read each file as array buffer for storage
        for (const file of files) {
          console.log('[SW] Reading file:', file.name, file.size);
          try {
            const arrayBuffer = await file.arrayBuffer();
            fileData.files.push({
              name: file.name,
              type: file.type,
              size: file.size,
              arrayBuffer: arrayBuffer,
            });
          } catch (readErr) {
            console.error('[SW] Error reading file:', file.name, readErr);
          }
        }

        if (fileData.files.length > 0) {
          console.log('[SW] Storing files in IndexedDB with id:', shareId);
          await storeFileData(fileData);

          // Notify all clients about the shared files
          const clients = await self.clients.matchAll();
          console.log('[SW] Notifying clients:', clients.length);
          for (const client of clients) {
            client.postMessage({
              type: 'SHARED_FILES',
              shareId: shareId,
            });
          }

          return shareId;
        } else {
          console.log('[SW] No files could be read');
          return null;
        }
      } else {
        console.log('[SW] No files in the request');
        return null;
      }
    } catch (err) {
      console.error('[SW] Error reading form data:', err);

      // Try different approach - check if launchQueue API is available (Chrome 110+),
      // which is the recommended way for PWA file handling
      console.log('[SW] LaunchQueue approach might be more reliable');
      return null;
    }
  } catch (err) {
    console.error(
      '[SW] Error processing share_target request:',
      err,
      err.stack
    );
    return null;
  }
}
