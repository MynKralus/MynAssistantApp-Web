const CACHE_NAME = "mynassistant-web-shell-v16";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./firebase-config.js",
  "./mynassistant-logo.webp",
  "./assets/mynassistant-ribbons-layer.webp",
  "./assets/mynassistant-ribbon-1.webp",
  "./assets/mynassistant-ribbon-2.webp",
  "./assets/mynassistant-ribbon-3.webp",
  "./assets/mynassistant-center-medallion.webp",
  "./mynassistant-icon-192.png",
  "./mynassistant-icon-512.png",
  "./manifest.webmanifest"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    try {
      const response = await fetch(request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    } catch {
      if (cached) return cached;
      if (request.mode === "navigate") {
        return (await caches.match("./index.html")) || Response.error();
      }
      return Response.error();
    }
  })());
});
