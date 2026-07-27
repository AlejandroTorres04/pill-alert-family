importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAeL4sIuuixcziq49OrDKEA0P4WmTOdOYE",
  authDomain: "pill-alert-family.firebaseapp.com",
  projectId: "pill-alert-family",
  storageBucket: "pill-alert-family.firebasestorage.app",
  messagingSenderId: "310888753519",
  appId: "1:310888753519:web:61c0f57be4b0e32dfa609a"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || 'Pill Alert Family';
  const options = {
    body: (payload.notification && payload.notification.body) || '',
    icon: 'icon-192.png'
  };
  self.registration.showNotification(title, options);
});

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
  if (url.includes('firestore') || url.includes('googleapis') || url.includes('firebaseio') || url.includes('fcm.googleapis')) {
    return; // nunca cachear datos en tiempo real
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
