const CACHE = 'meydan-v1';
const ASSETS = ['/', '/manifest.json'];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(ASSETS).catch(function() {}); }));
});

self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(function(res) {
      const copy = res.clone();
      caches.open(CACHE).then(function(c) { c.put(e.request, copy).catch(function() {}); });
      return res;
    }).catch(function() {
      return caches.match(e.request).then(function(r) { return r || caches.match('/'); });
    })
  );
});
