/* CPWA Service Worker — v13 */
const VERSION = '13';
const CACHE = 'pmapp-cpwa-v13';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './bundle.js?v=13',
];

// 新版本部署后立即生效：install 阶段直接 skipWaiting，配合 activate 的 clients.claim()
// 让新 SW 立即接管所有页面，无需用户手动点「更新」按钮。
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', e => {
  self.skipWaiting(); // 关键：新 SW 装好立即激活，杜绝旧 SW 一直喂旧 bundle
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Supabase API：始终走网络，不缓存
  if (url.hostname.includes('supabase')) return;
  // 同源静态资源：每次都向网络 revalidate，确保部署后第一时间拿到新版本
  e.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
