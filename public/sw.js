const CACHE_NAME = "taiwan-3d-offline-v1";

const PRECACHE_URLS = [
  "/",
  "/route",
  "/food",
  "/hotels",
  "/info",
  "/manifest.webmanifest",
  "/icon.svg",
  "/taiwan-images/taipei-skyline.svg",
  "/taiwan-images/night-market.svg",
  "/taiwan-images/taroko-gorge.svg",
  "/taiwan-images/sun-moon-lake.svg",
  "/taiwan-images/alishan-forest.svg",
  "/taiwan-images/michelin-street-food.svg",
  "/taiwan-images/boutique-hotel.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Cache-first for images & icons, network-first with cache fallback for pages/scripts
  if (
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/taiwan-images/") ||
    url.pathname === "/icon.svg"
  ) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((res) => {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            return res;
          })
      )
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/")))
  );
});
