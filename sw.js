/**
 * Paper Trader Service Worker
 * Enables PWA install + basic offline shell caching
 */

const CACHE = 'papertrader-v2';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  if (url.hostname.includes('coingecko') || url.hostname.includes('workers.dev') || url.hostname.includes('cloudflare')) {
    // Always network for live data
    e.respondWith(fetch(e.request).catch(() => new Response('Offline', { status: 503 })));
    return;
  }

  if (url.origin === location.origin) {
    // Network-first for our own app shell, so updates show up immediately.
    // Cache is only a fallback for offline use.
    e.respondWith(
      fetch(e.request).then(res => {
        const resClone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, resClone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
