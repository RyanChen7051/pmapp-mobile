// PMApp PWA Service Worker v82
const VERSION = 'v82';
const CACHE_NAME = 'pmapp-pwa-' + VERSION;
const ASSETS = ['./', './index.html', './bundle.js', './manifest.json', './icon-192-v2.png', './icon-512-v2.png', './apple-touch-icon-v2.png', './favicon-32-v2.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (e.data === 'CLEAR_CACHE') {
    caches.keys().then((keys) => {
      Promise.all(keys.map((k) => caches.delete(k))).then(() => {
        if (e.source) e.source.postMessage('CACHE_CLEARED');
      });
    });
  }
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache the SW script itself, so update detection always fetches fresh bytes
  if (url.pathname.endsWith('/sw.js')) {
    e.respondWith(fetch(e.request, { cache: 'no-cache' }));
    return;
  }

  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    // Network-first for HTML; bypass HTTP/CDN cache so new deploys appear fast
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' })
        .then((resp) => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
          }
          return resp;
        })
        .catch(() => caches.match(e.request).then((c) => c || caches.match('./')))
    );
    return;
  }

  // Stale-while-revalidate for other same-origin assets
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request, { cache: 'no-cache' })
        .then((resp) => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
          }
          return resp;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
