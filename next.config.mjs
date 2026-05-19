import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  // Disable PWA in development — avoids confusing cache behaviour during coding
  disable: process.env.NODE_ENV === "development",
  // Don't precache these (large / dynamic)
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    // ── Book cover images from external CDNs ────────────────────────
    // (Douban, OpenLibrary, Google Books, etc.) — long-lived cache
    {
      urlPattern: /^https:\/\/(?!.*\.blob\.vercel-storage\.com).+\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "book-covers",
        expiration: { maxEntries: 300, maxAgeSeconds: 30 * 24 * 60 * 60 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    // ── Public API endpoints (book list, posts, leaderboard) ─────────
    // NetworkFirst: fresh data when online, cached copy when offline
    {
      urlPattern: /\/api\/(?!file|upload|translate).*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-data",
        networkTimeoutSeconds: 8,
        expiration: { maxEntries: 100, maxAgeSeconds: 5 * 60 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    // ── Next.js static JS/CSS chunks ─────────────────────────────────
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "next-static",
        expiration: { maxEntries: 200, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    // ── Next.js image optimisation ───────────────────────────────────
    {
      urlPattern: /\/_next\/image\?.*/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "next-image",
        expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    // ── App pages (HTML) ─────────────────────────────────────────────
    {
      urlPattern: /^https?:\/\/[^/]+\/(books|share|profile|login|register).*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "pages",
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["covers.openlibrary.org", "books.google.com", "via.placeholder.com", "api.dicebear.com"],
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  webpack: (config) => {
    // Required for react-pdf — canvas is optional and unused in browser rendering
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default withPWA(nextConfig);
