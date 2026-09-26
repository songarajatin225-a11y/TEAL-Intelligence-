/* TEAL OS service worker — offline shell + cached data (spec §124).
   Navigation and app assets: cache-first after first load. Data, search indexes and knowledge:
   stale-while-revalidate, so offline use shows the last cached version (the UI shows OFFLINE MODE). */
const VERSION = 'teal-os-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './favicon.svg', './data/catalog.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const path = new URL(req.url).pathname;
  if (path.includes('/legacy/')) return; // legacy apps manage themselves
  const isData = /\/(data|search-index|knowledge|graph)\//.test(path);
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return isData ? cached || network : cached || network;
    }),
  );
});
