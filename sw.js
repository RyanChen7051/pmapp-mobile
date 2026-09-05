// PMApp PWA Service Worker v101
const VERSION = 'v119';
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

/* ─── Web Push（Apple Watch 镜像通知路径 A）─── */
self.addEventListener('push', (e) => {
  let data = { title: 'PMApp', body: '您有一条新提醒', url: './', tag: 'pmapp' };
  try { if (e.data) Object.assign(data, e.data.json()); } catch (_) {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icon-192-v2.png',
      badge: './favicon-32-v2.png',
      tag: data.tag || 'pmapp',
      renotify: !!data.tag,
      data: { url: data.url || './' },
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
      for (const c of cs) {
        if ('focus' in c) { c.navigate(target); return c.focus(); }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
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

  // JS bundles: network-first so new deploys take effect immediately
  // (防止部署新 bundle.js 后用户仍跑旧缓存 → 按钮按了没反应)
  // 但网络失败时必须回退到预缓存的 ./bundle.js（安装时已存好的同版本），
  // 否则 versioned key(bundle.js?v=XX) 与预缓存 key(./bundle.js) 不一致会取到 undefined
  // → 浏览器拿到空 JS → 整页白屏、PWA 点不开。
  if (url.pathname.endsWith('.js')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' })
        .then((resp) => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
          }
          return resp;
        })
        .catch(() => caches.match(e.request).then((c) => c || caches.match('./bundle.js')))
    );
    return;
  }

  // Stale-while-revalidate for other same-origin assets (images, manifest, etc.)
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
