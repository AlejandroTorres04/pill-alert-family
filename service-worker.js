const CACHE_NAME = 'pill-alert-family-v1';
const SHELL_FILES = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first para el "cascarón" de la app; todo lo demás (Firebase) va directo a la red
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  if (url.includes('firestore') || url.includes('googleapis') || url.includes('firebaseio')) {
    return; // nunca cachear datos en tiempo real
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
