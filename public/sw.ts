/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'goai-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
];

self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;

  // Sécurité : seules les requêtes GET sont cachées
  if (request.method !== 'GET') {
    return;
  }

  // Sécurité : ne pas cacher les requêtes vers d'autres origines non-autorisées
  const allowedOrigins = [self.location.origin, 'https://cdn.jsdelivr.net'];
  const requestUrl = new URL(request.url);
  const isAllowedOrigin = allowedOrigins.some(origin => requestUrl.origin === origin);

  if (!isAllowedOrigin) {
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        return cached;
      }

      return fetch(request).then(response => {
        // Sécurité : ne cacher que les réponses valides (pas opaque, pas erreur)
        if (
          !response ||
          response.status !== 200 ||
          response.type === 'error' ||
          response.type === 'opaque'
        ) {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Sécurité : fallback silencieux en cas d'erreur réseau
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});
