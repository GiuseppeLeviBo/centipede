const CACHE_NAME = 'centipede-v4';
const scope = self.registration ? self.registration.scope : './';
const scopeRoot = scope.endsWith('/') ? scope : scope + '/';

// Derive the scope root path from the service worker's own URL.
// This makes the game deployable in any subdirectory (GitHub Pages, etc.).
const swUrl = new URL(self.location.href);
const basePath = swUrl.pathname.replace(/\/sw\.js$/, '');
const rootUrl = swUrl.origin + basePath + '/';

const urlsToCache = [
  rootUrl,
  rootUrl + 'index.html',
  rootUrl + 'manifest.json',
  rootUrl + 'icon-192.png',
  rootUrl + 'icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // If some assets aren't available yet, don't block installation
      });
    })
  );
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const toCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, toCache));
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((r) => r || caches.match(rootUrl + 'index.html'))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const toCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, toCache));
        return response;
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  event.waitUntil(self.clients.claim());
});
