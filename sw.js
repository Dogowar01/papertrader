/**
 * Paper Trader — Service Worker KILL SWITCH
 * The app no longer uses a service worker (it needs live network data
 * anyway, and offline caching kept serving stale snapshots after updates).
 * If any previously-installed worker is still active and checks for
 * updates, this version wipes its caches, unregisters itself, and forces
 * any open page to reload so the real network version loads instead.
 */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll())
      .then((clients) => clients.forEach((client) => client.navigate(client.url)))
  );
});
