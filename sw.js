// PMApp PWA Service Worker v23
const CACHE_NAME = 'pmapp-pwa-v23';
const ASSETS = ['./', './index.html', './bundle.js', './manifest.json'];

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
  if (e.data === 'CLEAR_CACHE') {
    caches.keys().then((keys) => {
      Promise.all(keys.map((k) => caches.delete(k))).then(() => {
        if (e.source) e.source.postMessage('CACHE_CLEARED');
      });
    });
  }
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin === self.location.origin) {
    // Network-first for navigation requests (HTML pages) - ensures latest UI
    if (e.request.mode === 'navigate' || e.request.destination === 'document') {
      e.respondWith(
        fetch(e.request)
          .then((resp) => {
            if (resp.ok) {
              const respClone = resp.clone();
              caches.open(CACHE_NAME).then((c) => c.put(e.request, respClone));
            }
            return resp;
          })
          .catch(() => caches.match(e.request).then((c) => c || caches.match('./')))
      );
      return;
    }
    // Stale-while-revalidate for other assets
    e.respondWith(
      caches.match(e.request).then((cached) => {
        const fetchPromise = fetch(e.request)
          .then((resp) => {
            if (resp.ok) {
              const respClone = resp.clone();
              caches.open(CACHE_NAME).then((c) => c.put(e.request, respClone));
            }
            return resp;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
