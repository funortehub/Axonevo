
const CACHE_NAME = 'axonevo-pwa-v2';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // We don't cache external resources during install
        // as they can fail and break the SW installation.
        // They will be cached on the first fetch.
        return cache.addAll(URLS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Don't cache Firebase requests as they need to be fresh.
  if (event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('firebaseapp.com')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return fetch(event.request).then((networkResponse) => {
        // If the fetch is successful, update the cache
        cache.put(event.request, networkResponse.clone());
        return networkResponse;
      }).catch(() => {
        // If the network fails, try to serve from cache
        return cache.match(event.request);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});
