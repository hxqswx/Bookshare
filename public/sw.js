/**
 * 我们真的爱读书 — Service Worker
 * Simple NetworkFirst strategy with image CacheFirst fallback.
 * No workbox dependency — plain Fetch API + Cache API.
 */

const CACHE_VERSION = "v1";
const APP_CACHE    = `app-${CACHE_VERSION}`;
const IMAGE_CACHE  = `images-${CACHE_VERSION}`;
const API_CACHE    = `api-${CACHE_VERSION}`;

const PRECACHE_URLS = ["/", "/books", "/share", "/offline"];

// ── Install: precache core pages ─────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch(() => {})
    )
  );
  self.skipWaiting();
});

// ── Activate: clean up old caches ────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  const current = [APP_CACHE, IMAGE_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !current.includes(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, extensions, private/upload/translate APIs
  if (
    request.method !== "GET" ||
    url.protocol === "chrome-extension:" ||
    url.pathname.startsWith("/api/file") ||
    url.pathname.startsWith("/api/upload") ||
    url.pathname.startsWith("/api/translate")
  ) return;

  // ── Images: CacheFirst (long-lived) ──────────────────────────────────────
  if (
    request.destination === "image" ||
    /\.(png|jpe?g|webp|gif|svg|ico)(\?.*)?$/i.test(url.pathname)
  ) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          return cached ?? new Response("", { status: 408 });
        }
      })
    );
    return;
  }

  // ── API data: NetworkFirst with short cache ───────────────────────────────
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          return (await cache.match(request)) ?? new Response(
            JSON.stringify({ error: "offline" }),
            { status: 503, headers: { "Content-Type": "application/json" } }
          );
        }
      })
    );
    return;
  }

  // ── HTML navigation: NetworkFirst, offline page fallback ─────────────────
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(
      caches.open(APP_CACHE).then(async (cache) => {
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          return (
            (await cache.match(request)) ||
            (await cache.match("/offline")) ||
            new Response("Offline", { status: 503 })
          );
        }
      })
    );
    return;
  }

  // ── Everything else: NetworkFirst ────────────────────────────────────────
  event.respondWith(
    caches.open(APP_CACHE).then(async (cache) => {
      try {
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      } catch {
        return (await cache.match(request)) ?? fetch(request);
      }
    })
  );
});
