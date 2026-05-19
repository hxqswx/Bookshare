import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  // Keep SW active even when no clients (background sync)
  extendDefaultRuntimeCaching: true,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      // ── Book cover images from external CDNs ──────────────────────
      {
        urlPattern: /^https:\/\/(?!.*\.blob\.vercel-storage\.com).+\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "book-covers",
          expiration: { maxEntries: 300, maxAgeSeconds: 30 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // ── Public API endpoints ──────────────────────────────────────
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
      // ── App pages ─────────────────────────────────────────────────
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
  },
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
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default withPWA(nextConfig);
