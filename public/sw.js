/* Dashboard Biiip — SW minimal pour installabilité PWA (pas de cache API). */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Network only — l'app a besoin des données live.
  event.respondWith(fetch(event.request));
});
