/* TEAL OS service worker — offline shell + cached data (spec §124).
   Navigation: network-first, cached index.html offline. Data, search indexes, graph, knowledge:
   network-first so a new deploy is used immediately; the last cached copy is served offline (the UI
   shows OFFLINE MODE). Hashed app assets: cache-first (their names change with every build). */
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
      const fromNetwork = () =>
        fetch(req).then((res) => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        });
      if (isData) return fromNetwork().catch(async () => (await cache.match(req)) ?? Response.error());
      return (await cache.match(req)) ?? fromNetwork();
    }),
  );
});
