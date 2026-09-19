/* FPWA Service Worker — v9 */
const VERSION = '9';
const CACHE = 'pmapp-fpwa-v9';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './bundle.js?v=9',
];

// 让新版本立即生效：收到 SKIP_WAITING 后结束旧的等待（由首页「更新」按钮触发）
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', e => {
  // 注意：不在 install 阶段自动 skipWaiting，
  // 留给首页「发现新版本」按钮在用户点击时再 postMessage('SKIP_WAITING')，
  // 避免静默刷新、确保更新按钮有意义。
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
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
