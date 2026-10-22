const CACHE_NAME = "taiwan-3d-offline-v2";

const PRECACHE_URLS = [
  "/",
  "/route",
  "/food",
  "/hotels",
  "/info",
  "/manifest.webmanifest",
  "/icon.svg",
  "/apple-touch-icon.png",
  "/data/cities.json",
  "/data/route.json",
  "/data/attractions.json",
  "/data/food.json",
  "/data/hotels.json",
  "/data/practical.json",
  "/data/overrides.json",
  "/images/cities/taipei.jpg",
  "/images/cities/hualien.jpg",
  "/images/cities/taitung.jpg",
  "/images/cities/kaohsiung.jpg",
  "/images/cities/tainan.jpg",
  "/images/cities/alishan.jpg",
  "/images/cities/sun-moon-lake.jpg",
  "/images/cities/taichung.jpg",
  "/images/cities/pingtung.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(PRECACHE_URLS.map((u) => cache.add(u)))
      )
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

self.addEventListener("message", (event) => {
  const data = event.data;
  if (data && data.type === "PRECACHE_URLS" && Array.isArray(data.urls)) {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) =>
        Promise.allSettled(data.urls.map((u) => cache.add(u)))
      )
    );
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Cache-first for /data, fonts (.woff2), images & icons
  if (
    url.pathname.startsWith("/data/") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.startsWith("/_next/static/media/") ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/taiwan-images/") ||
    url.pathname === "/icon.svg" ||
    url.pathname === "/apple-touch-icon.png"
  ) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((res) => {
            if (res && res.status === 200) {
              const clone = res.clone();
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(event.request, clone));
            }
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
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() =>
        caches
          .match(event.request)
          .then((cached) => cached || caches.match("/"))
      )
  );
});
